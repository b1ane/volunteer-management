// src/UpcomingEvents.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function UpcomingEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        // 1) Who's logged in? (support both keys for compatibility)
        const email =
          localStorage.getItem('email') || localStorage.getItem('userEmail');
        if (!email) throw new Error('No logged-in email found');

        // 2) Look up volunteerId (now under /upcomingevents)
        const idResp = await axios.get(`${API}/upcomingevents/volunteer-id`, { params: { email } });
        const volunteerId = idResp?.data?.volunteerId;
        if (!volunteerId) throw new Error('Unable to resolve volunteer ID for upcoming events');

        // 3) Fetch assigned events for this volunteer (also under /upcomingevents)
        const { data } = await axios.get(`${API}/upcomingevents/assigned`, { params: { volunteerId } });
        if (!alive) return;

        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        console.error('Upcoming assigned events error:', e);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load upcoming events';
        setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const fmt = (d) =>
    d && dayjs(d).isValid() ? dayjs(d).format('MMM D, YYYY h:mm A') : 'TBD';

  if (loading) return <div style={{ padding: '1rem' }}>Loading upcoming events…</div>;
  if (err) return <div style={{ color: '#b00', padding: '1rem' }}>{err}</div>;
  if (!events.length) return <div style={{ padding: '1rem' }}>No upcoming events.</div>;

  return (
    <div style={{ padding: '1rem 1.25rem', maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1rem' }}>My Upcoming Events</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
        {events
          .slice()
          .sort((a, b) => new Date(a.start_time || 0) - new Date(b.start_time || 0))
          .map((ev, i) => (
            <li key={ev.id ?? i} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <h3 style={{ margin: 0 }}>{ev.title || ev.name || ev.event_name || 'Untitled Event'}</h3>
                <span>{fmt(ev.start_time)}</span>
              </div>
              {ev.location && <div style={{ opacity: 0.8, marginTop: 4 }}>📍 {ev.location}</div>}
              {ev.description && <p style={{ marginTop: 8 }}>{ev.description}</p>}
            </li>
          ))}
      </ul>
    </div>
  );
}
