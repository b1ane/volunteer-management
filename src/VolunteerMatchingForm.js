import React, { useState, useEffect } from 'react';

function VolunteerMatchingForm() {
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [matchedEvents, setMatchedEvents] = useState([]);

  useEffect(() => {
    // Fetch volunteers
    fetch('http://localhost:5000/volunteers')
      .then(res => res.json())
      .then(data => setVolunteers(data))
      .catch(err => console.error('Error fetching volunteers:', err));

    // Fetch events
    fetch('http://localhost:5000/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error('Error fetching events:', err));
  }, []);

    useEffect(() => {
    if (!selectedVolunteerId) return;

    const volunteer = volunteers.find(v => v.id === parseInt(selectedVolunteerId));

    if (volunteer) {
      const matches = events.filter(event =>
        event.requiredSkills.some(skill => volunteer.skills.includes(skill)) &&
        volunteer.availability.includes(event.eventDate)
      );
      setMatchedEvents(matches);
    } else {
      setMatchedEvents([]);
    }
  }, [selectedVolunteerId, volunteers, events]);


  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Volunteer Matching</h1>

      <label>Select a Volunteer:</label><br />
      <select value={selectedVolunteerId} onChange={(e) => setSelectedVolunteerId(e.target.value)}>
        <option value="">-- Select --</option>
        {volunteers.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>

      <br /><br />

      <h3>Matched Events</h3>
      {matchedEvents.length > 0 ? (
        <ul>
          {matchedEvents.map((event) => (
            <li key={event.id}>
              {event.name} — {new Date(event.eventDate).toLocaleDateString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>No matched events for this volunteer.</p>
      )}
    </div>
  );
}

export default VolunteerMatchingForm;
