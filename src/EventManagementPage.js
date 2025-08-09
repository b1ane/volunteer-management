// src/EventManagementPage.js
import React, { useState, useEffect } from 'react';
import './EventManagementFormLayout.css';
import { useNavigate } from 'react-router-dom';

// Use numeric urgency values (1..5)
const urgencyOptions = [
  { label: 'Low', value: 2 },
  { label: 'Medium', value: 3 },
  { label: 'High', value: 5 },
];

// If you only want a single skill, keep this list.
// If you want multiple, switch back to <select multiple> or a text/textarea parser.
const skillsOptions = ['Cooking', 'Tutoring', 'Driving', 'Event Setup'];

export default function EventManagementPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      alert('Access denied: Administrators only');
      navigate('/profile');
    }
  }, [navigate]);

  const [form, setForm] = useState({
    eventName: '',
    eventDescription: '',
    location: '',
    requiredSkills: [],   // must be an array for backend
    urgency: '',          // will hold the numeric value as a string, e.g. "3"
    eventDate: '',
    stateCode: ''         // optional (e.g., "TX")
  });

  const handleChange = ({ target: { name, value } }) =>
    setForm(f => ({ ...f, [name]: value }));

  // Single-skill select -> keep array shape
  const handleSkill = (e) =>
    setForm(f => ({ ...f, requiredSkills: e.target.value ? [e.target.value] : [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eventData = {
      name: form.eventName,
      description: form.eventDescription,        // ✅ correct key
      location: form.location,
      requiredSkills: form.requiredSkills,       // ✅ array
      urgency: Number(form.urgency),             // ✅ number 1..5
      event_date: form.eventDate,                // ✅ snake_case + YYYY-MM-DD
      stateCode: form.stateCode || null          // optional
    };

    try {
      const res = await fetch('/events', {       // use CRA proxy or set REACT_APP_API_URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `Failed (${res.status})`);
      }

      alert(`Event created: ${data.name}`);
      // Reset form if you want
      // setForm({ eventName:'', eventDescription:'', location:'', requiredSkills:[], urgency:'', eventDate:'', stateCode:'' });
    } catch (err) {
      console.error('Create event failed:', err);
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Event Management Form</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="eventName">Event Name</label>
          <input id="eventName" name="eventName" required maxLength={100}
                 value={form.eventName} onChange={handleChange}/>
        </div>

        <div className="form-group">
          <label htmlFor="eventDescription">Event Description</label>
          <textarea id="eventDescription" name="eventDescription" rows={4} required
                    value={form.eventDescription} onChange={handleChange}/>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <textarea id="location" name="location" rows={2} required
                    value={form.location} onChange={handleChange}/>
        </div>

        <div className="form-group">
          <label htmlFor="requiredSkills">Required Skill</label>
          <select id="requiredSkills" name="requiredSkills" required
                  value={form.requiredSkills[0] || ''} onChange={handleSkill}>
            <option value="">--Select a skill--</option>
            {skillsOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="urgency">Urgency</label>
          <select id="urgency" name="urgency" required
                  value={form.urgency} onChange={handleChange}>
            <option value="" disabled>Pick urgency</option>
            {urgencyOptions.map(u => (
              <option key={u.label} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="eventDate">Event Date</label>
          <input id="eventDate" name="eventDate" type="date" required
                 value={form.eventDate} onChange={handleChange}/>
        </div>

        {/* Optional state code */}
        {/* <div className="form-group">
          <label htmlFor="stateCode">State</label>
          <input id="stateCode" name="stateCode" maxLength={2}
                 value={form.stateCode} onChange={handleChange}/>
        </div> */}

        <button type="submit" className="button">Save Event</button>
      </form>
    </div>
  );
}
