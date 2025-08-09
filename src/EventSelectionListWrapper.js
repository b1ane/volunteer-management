import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


export default function EventSelectionList({ onContinue }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

    useEffect(() => {
      const role = localStorage.getItem('userRole');
      if (role !== 'admin') {
        alert('Access denied: Administrators only');
        navigate('/profile');
      }
    }, [navigate]);
    
  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/events')
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(err => setError(`Error fetching events: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return String(e.name || '').toLowerCase().includes(q)
        || String(e.location || '').toLowerCase().includes(q);
  });

  const selectedEvent = events.find(e => String(e.id) === String(selectedEventId));

  const handleContinue = () => {
    if (!selectedEvent) return;

    // Support different id field names from your API
    const id = selectedEvent.id ?? selectedEvent.eventId ?? selectedEvent.event_id;
    if (!id) {
      alert('Selected event has no id. Check your /events payload.');
      return;
    }

    if (onContinue) {
      onContinue(selectedEvent);
    } else {
      // Default behavior: go to the select-volunteers page for this event
      navigate(`/match/${id}/select`, { state: { event: selectedEvent } });
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', maxWidth: 900, margin: '0 auto' }}>
      <h1>Volunteer Matching — Select an Event</h1>

      <div style={{ margin: '1rem 0', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Search by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '0.5rem' }}
        />
      </div>

      {loading && <p>Loading events…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && filtered.length === 0 && <p>No events found.</p>}

      {!loading && filtered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Select</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Event</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Date</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Location</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Required Skills</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(event => (
              <tr key={event.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>
                  <input
                    type="radio"
                    name="selectedEvent"
                    value={event.id}
                    checked={String(selectedEventId) === String(event.id)}
                    onChange={() => setSelectedEventId(event.id)}
                  />
                </td>
                <td style={{ padding: 8 }}>{event.name}</td>
                <td style={{ padding: 8 }}>
                  {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: 8 }}>{event.location || '—'}</td>
                <td style={{ padding: 8 }}>
                  {Array.isArray(event.requiredSkills) ? event.requiredSkills.join(', ') : String(event.requiredSkills || '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {selectedEvent ? (
            <span>
              Selected: <strong>{selectedEvent.name}</strong> —{' '}
              {selectedEvent.eventDate ? new Date(selectedEvent.eventDate).toLocaleDateString() : 'No date'}
            </span>
          ) : (
            <span>Select an event to continue.</span>
          )}
        </div>
        <button
          type="button"
          disabled={!selectedEventId}
          onClick={handleContinue}
          style={{ padding: '0.6rem 1rem', cursor: selectedEventId ? 'pointer' : 'not-allowed', opacity: selectedEventId ? 1 : 0.6 }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
