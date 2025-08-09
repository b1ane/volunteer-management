import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const API_BASE = 'http://localhost:5000';

function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (email) {
      localStorage.setItem('userEmail', email);
    }
  }, [email]);

  const [form, setForm] = useState({
    fullName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    skills: [],
    preferences: '',
    availability: [],
    currentDate: ''
  });

  const skillsOptions = ['Cooking', 'Tutoring', 'Driving', 'Event Setup'];
  const [customSkill, setCustomSkill] = useState('');
  const [statesList, setStatesList] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/states`)
      .then(res => setStatesList(res.data))
      .catch(err => console.error('Failed to fetch states:', err));
  }, []);

  const fetchProfile = () => {
    if (!email) return;

    axios.get(`${API_BASE}/profile`, { params: { email } })
      .then(res => {
        const data = res.data;
        setForm({
          fullName: data.full_name || '',
          address1: data.address1 || '',
          address2: data.address2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          skills: Array.isArray(data.skills) ? data.skills : JSON.parse(data.skills || '[]'),
          preferences: data.preferences || '',
          availability: Array.isArray(data.availability) ? data.availability : JSON.parse(data.availability || '[]'),
          currentDate: ''
        });
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, [email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillSelect = (e) => {
    const selectedSkill = e.target.value;
    setForm(prev => ({ ...prev, skills: selectedSkill ? [selectedSkill] : [] }));
  };

  const handleAddSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed) {
      setForm(prev => ({ ...prev, skills: [trimmed] }));
      setCustomSkill('');
    }
  };

  const handleAddDate = () => {
    if (form.currentDate && !form.availability.includes(form.currentDate)) {
      setForm(prev => ({
        ...prev,
        availability: [...prev.availability, form.currentDate],
        currentDate: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !form.fullName || !form.address1 || !form.city || !form.state || !form.zip) {
      alert('Please complete all required fields.');
      return;
    }

    if (userRole === 'volunteer' && (form.skills.length === 0 || form.availability.length === 0)) {
      alert('Please complete all required fields (Skills and Availability).');
      return;
    }

    const payload = {
      email,
      fullName: form.fullName,
      address1: form.address1,
      address2: form.address2,
      city: form.city,
      state: form.state,
      zip: form.zip
    };

    if (userRole === 'volunteer') {
      payload.skills = form.skills;
      payload.preferences = form.preferences;
      payload.availability = form.availability;
    }

    try {
      const res = await axios.post(`${API_BASE}/profile`, payload);
      alert(res.data.message);
      fetchProfile();
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile');
    }
  };

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Full Name:</label>
          <input name="fullName" maxLength="50" required value={form.fullName} onChange={handleChange} />
        </div>

        <div>
          <label>Address 1:</label>
          <input name="address1" maxLength="100" required value={form.address1} onChange={handleChange} />
        </div>

        <div>
          <label>Address 2 (optional):</label>
          <input name="address2" maxLength="100" value={form.address2} onChange={handleChange} />
        </div>

        <div>
          <label>City:</label>
          <input name="city" maxLength="100" required value={form.city} onChange={handleChange} />
        </div>

        <div>
          <label>State:</label>
          <select name="state" required value={form.state} onChange={handleChange}>
            <option value="">Select a state</option>
            {statesList.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Zip Code:</label>
          <input name="zip" pattern="\d{5,9}" required value={form.zip} onChange={handleChange} />
        </div>

        {userRole === 'volunteer' && (
          <>
            <div>
              <label>Skills:</label>
              <select
                required
                value={form.skills[0] || ''}
                onChange={handleSkillSelect}
              >
                <option value="">Select a skill</option>
                {[...skillsOptions, ...form.skills.filter(s => !skillsOptions.includes(s))].map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Add custom skill"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
              />
              <button type="button" onClick={handleAddSkill}>Add Skill</button>
            </div>

            <div>
              <label>Preferences (optional):</label>
              <textarea name="preferences" rows="4" cols="40" value={form.preferences} onChange={handleChange}></textarea>
            </div>

            <div>
              <label>Pick a date you're available:</label>
              <input
                type="date"
                value={form.currentDate}
                onChange={(e) => setForm({ ...form, currentDate: e.target.value })}
              />
              <button type="button" onClick={handleAddDate}>Add Date</button>
            </div>

            <div>
              <label>Availability Dates:</label>
              <ul>
                {form.availability.map((date, idx) => (
                  <li key={idx}>{date}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}

export default ProfilePage;
