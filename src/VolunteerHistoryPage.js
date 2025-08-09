// src/VolunteerHistoryPage.js
import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function VolunteerHistoryPage() {
  const email = localStorage.getItem('userEmail'); // set at login

  const [history, setHistory] = useState([]);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    eventId: '',
    date: '',        // YYYY-MM-DD
    hours: '',
    role: '',
    notes: ''
  });

  const safeJson = async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON, got: ${text.slice(0,120)}…`);
    }
    return res.json();
  };

  const loadHistory = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/history/volunteer?email=${encodeURIComponent(email)}`);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.message || `Failed (${res.status})`);
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await fetch(`${API}/events`);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setEvents(data);
    } catch (e) {
      // not fatal for history view
      console.warn('Failed to load events:', e.message);
      setEvents([]);
    }
  };

  useEffect(() => {
    if (email) {
      loadHistory();
      loadEvents();
    }
  }, [email]);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.eventId) return alert('Pick an event');

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        volunteerEmail: email,
        eventId: Number(form.eventId),
        participation_date: form.date || undefined,     // backend defaults to event_date if omitted
        role: form.role || undefined,
        hours: form.hours ? Number(form.hours) : undefined,
        notes: form.notes || undefined                  // only persists if DB has a notes column
      };

      const res = await fetch(`${API}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.message || `Failed (${res.status})`);

      await loadHistory(); // keep table in sync with API
      setForm({ eventId: '', date: '', hours: '', role: '', notes: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!email) return <div>Please log in — no email found.</div>;
  if (loading) return <div>Loading…</div>;

  const fmt = (d) => (d ? String(d).slice(0, 10) : '');

  return (
    <div style={{ padding: 16 }}>
      <h2>Volunteer History</h2>
      <p style={{ opacity: .7 }}>Signed in as: <b>{email}</b></p>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}

      <form onSubmit={onSubmit} style={{ marginBottom: 24 }}>
        <h3>Add New Record</h3>

        <div>
          <label>
            Event:&nbsp;
            <select
              name="eventId"
              value={form.eventId}
              onChange={onChange}
              required
            >
              <option value="">-- Select an event --</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({fmt(ev.event_date)})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>Date: <input name="date" type="date" value={form.date} onChange={onChange} /></label>
          <small style={{ marginLeft: 8, opacity: .7 }}>
            Leave blank to use the event date
          </small>
        </div>

        <div>
          <label>Hours: <input name="hours" type="number" min="0" step="0.5" value={form.hours} onChange={onChange} /></label>
        </div>

        <div>
          <label>Role: <input name="role" maxLength={50} value={form.role} onChange={onChange} placeholder="Volunteer" /></label>
        </div>

        <div>
          <label>Notes: <input name="notes" maxLength={200} value={form.notes} onChange={onChange} /></label>
        </div>

        <button type="submit" disabled={submitting || !form.eventId}>
          {submitting ? 'Submitting…' : 'Add Record'}
        </button>
      </form>

      {history.length === 0 ? (
        <p>No history records found.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Event ID</th>
              <th>Hours</th>
              <th>Role</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {history.map(r => (
              <tr key={r.id}>
                <td>{fmt(r.participation_date)}</td>
                <td>{r.eventName}</td>
                <td>{r.eventId}</td>
                <td>{r.hours ?? 0}</td>
                <td>{r.role || 'Volunteer'}</td>
                <td>{r.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
