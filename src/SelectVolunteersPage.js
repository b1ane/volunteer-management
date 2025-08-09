import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

const API = 'http://localhost:5000';

export default function SelectVolunteersPage() {
  const { eventId } = useParams();
  const { state } = useLocation();

  const [event, setEvent] = useState(state?.event || null);
  const [volunteers, setVolunteers] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [selectedAssigned, setSelectedAssigned] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [search, setSearch] = useState('');
  const [hideAssigned, setHideAssigned] = useState(true);

  // -------- helpers --------
  const getId = (o) =>
    o?.id ?? o?.user_id ?? o?.volunteer_id ?? o?.eventId ?? o?.event_id;

  const getName = (v) => {
    if (v?.name) return v.name;
    if (v?.full_name) return v.full_name; // from userprofile
    const joined = [v?.first_name, v?.last_name].filter(Boolean).join(' ');
    return joined || v?.username || '(no name)';
  };

  const getEmail = (v) => v?.email || v?.contact_email || '—';

  const getSkillsDisplay = (v) => {
    const s = v?.skills;
    if (Array.isArray(s)) return s.join(', ');
    if (typeof s === 'string') return s;
    return '—';
  };

  // -------- load data --------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        // fetch event if we landed here directly
        if (!event) {
          const er = await fetch(`${API}/events/${eventId}`);
          if (!er.ok) throw new Error(`Failed to fetch event ${eventId} (${er.status})`);
          const ejson = await er.json();
          if (!cancelled) setEvent(ejson);
        }

        const [vRes, aRes] = await Promise.all([
          fetch(`${API}/volunteers`),
          fetch(`${API}/match?eventId=${eventId}`)
        ]);

        if (!vRes.ok) throw new Error(`Failed to fetch volunteers (${vRes.status})`);
        if (!aRes.ok) throw new Error(`Failed to fetch current assignments (${aRes.status})`);

        const vJson = await vRes.json();
        const aJson = await aRes.json();

        const vList = Array.isArray(vJson) ? vJson : (vJson?.data || []);
        const aList = Array.isArray(aJson) ? aJson : (aJson?.data || []);

        if (!cancelled) {
          setVolunteers(vList);
          setAssigned(aList);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]); // don't depend on "event" to avoid double fetches

  // Set of volunteer_ids that are already assigned
  const assignedIds = useMemo(
    () => new Set(assigned.map((a) => a.volunteer_id)),
    [assigned]
  );

  const filteredVolunteers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return volunteers.filter((v) => {
      if (hideAssigned && assignedIds.has(getId(v))) return false;
      if (!q) return true;
      return (
        getName(v).toLowerCase().includes(q) ||
        getEmail(v).toLowerCase().includes(q) ||
        getSkillsDisplay(v).toLowerCase().includes(q)
      );
    });
  }, [volunteers, search, hideAssigned, assignedIds]);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAssigned = (volunteerId) => {
    const next = new Set(selectedAssigned);
    next.has(volunteerId) ? next.delete(volunteerId) : next.add(volunteerId);
    setSelectedAssigned(next);
  };

  const refreshAssignments = async () => {
    const aRes = await fetch(`${API}/match?eventId=${eventId}`);
    const aJson = await aRes.json();
    setAssigned(Array.isArray(aJson) ? aJson : (aJson?.data || []));
  };

  const assign = async () => {
    if (selected.size === 0) return;
    try {
      const res = await fetch(`${API}/match/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: Number(eventId), volunteerIds: [...selected] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Bulk assign failed');

      // Optimistic add so newly assigned volunteers disappear immediately
      const nowIso = new Date().toISOString();
      const selectedIds = new Set(selected);
      const newlyAssigned = volunteers
        .filter(v => selectedIds.has(v.id))
        .map(v => ({
          id: `tmp-${eventId}-${v.id}`, // temp client id
          event_id: Number(eventId),
          volunteer_id: v.id,
          status: 'assigned',
          assigned_at: nowIso,
          name: v.name || null,
          first_name: v.first_name || null,
          last_name: v.last_name || null,
          email: v.email || null
        }));
      setAssigned(prev => [...newlyAssigned, ...prev]);
      setSelected(new Set());

      // Reconcile with server
      await refreshAssignments();

      alert(`Assigned: ${data.inserted ?? 0}, Skipped: ${data.duplicatesSkipped ?? 0}`);
    } catch (e) {
      alert(e.message || 'Bulk assign failed');
    }
  };

  const unassign = async () => {
    if (selectedAssigned.size === 0) return;
    try {
      const res = await fetch(`${API}/match/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: Number(eventId),
          volunteerIds: [...selectedAssigned]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Bulk unassign failed');

      // Optimistic remove from UI
      setAssigned(prev => prev.filter(a => !selectedAssigned.has(a.volunteer_id)));
      setSelectedAssigned(new Set());

      // Reconcile with server
      await refreshAssignments();

      alert(`Unassigned: ${data.removed ?? 0}`);
    } catch (e) {
      alert(e.message || 'Bulk unassign failed');
    }
  };

  // -------- render --------
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (err) return <div style={{ padding: 24, color: 'crimson' }}>{err}</div>;

  const eventDate =
    event?.eventDate || event?.event_date
      ? new Date(event.eventDate || event.event_date).toLocaleDateString()
      : '—';

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>Assign Volunteers → {event?.name || event?.eventName || `Event #${eventId}`}</h1>
      <p>{event?.location || event?.place || '—'} • {eventDate}</p>

      {/* Controls */}
      <div style={{ display:'flex', gap:12, alignItems:'center', margin:'12px 0 18px' }}>
        <input
          type="text"
          placeholder="Search volunteers (name, email, skills)…"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          style={{ flex:1, padding:'8px' }}
        />
        <label style={{ display:'flex', alignItems:'center', gap:6 }}>
          <input
            type="checkbox"
            checked={hideAssigned}
            onChange={(e)=>setHideAssigned(e.target.checked)}
          />
          Hide already assigned
        </label>
      </div>

      {/* Volunteers table */}
      <h3 style={{ marginTop: 12 }}>Volunteers</h3>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}></th>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}>Name</th>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}>Email</th>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}>Skills</th>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}>Already Assigned?</th>
          </tr>
        </thead>
        <tbody>
          {filteredVolunteers.length === 0 && (
            <tr><td colSpan={5} style={{ padding:12 }}>No volunteers found.</td></tr>
          )}
          {filteredVolunteers.map((v) => {
            const vid = getId(v);
            const isAssigned = assignedIds.has(vid);
            return (
              <tr key={vid} style={{ borderBottom:'1px solid #eee' }}>
                <td style={{ padding:8 }}>
                  <input
                    type="checkbox"
                    disabled={isAssigned}
                    checked={selected.has(vid)}
                    onChange={() => toggle(vid)}
                  />
                </td>
                <td style={{ padding:8 }}>{getName(v)}</td>
                <td style={{ padding:8 }}>{getEmail(v)}</td>
                <td style={{ padding:8 }}>{getSkillsDisplay(v)}</td>
                <td style={{ padding:8 }}>{isAssigned ? 'Yes' : 'No'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        type="button"
        style={{ marginTop: 12, padding:'8px 12px' }}
        disabled={selected.size === 0}
        onClick={assign}
      >
        Match selected volunteers to event
      </button>

      {/* Current assignments */}
      <h3 style={{ marginTop: 32 }}>Already Assigned</h3>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}></th>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}>Name</th>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}>Status</th>
            <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #ddd' }}>Assigned At</th>
          </tr>
        </thead>
        <tbody>
          {assigned.length === 0 && (
            <tr><td colSpan={4} style={{ padding:12 }}>No assignments yet.</td></tr>
          )}
          {assigned.map((a) => {
            const vid = a.volunteer_id;
            return (
              <tr key={a.id ?? `${a.event_id}-${vid}`} style={{ borderBottom:'1px solid #eee' }}>
                <td style={{ padding:8 }}>
                  <input
                    type="checkbox"
                    checked={selectedAssigned.has(vid)}
                    onChange={() => toggleAssigned(vid)}
                  />
                </td>
                <td style={{ padding:8 }}>
                  {[a.first_name, a.last_name].filter(Boolean).join(' ') || a.name || a.email || '—'}
                </td>
                <td style={{ padding:8 }}>{a.status || 'assigned'}</td>
                <td style={{ padding:8 }}>
                  {a.assigned_at ? new Date(a.assigned_at).toLocaleString() : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        type="button"
        style={{ marginTop: 12, padding:'8px 12px' }}
        disabled={selectedAssigned.size === 0}
        onClick={unassign}
      >
        Unassign selected volunteers from event
      </button>
    </div>
  );
}
