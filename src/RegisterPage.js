import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegisterPage.css';


function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || !form.confirmPassword || !form.role) {
      alert("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const payload = {
      email: form.email,
      password: form.password,
      role: form.role
    };

    // Include extra fields only if the role is volunteer
    if (form.role === 'volunteer') {
      payload.skills = form.skills;
      payload.availability = form.availability;
    }

    try {
      const res = await axios.post('http://localhost:5000/volunteers', payload);

      alert('Registration successful. Please check your email to verify your account.');
      navigate('/', { state: { email: form.email } });
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.status === 409
          ? 'That email is already registered. Try logging in instead.'
          : err.response?.data?.message || 'Registration failed.'
      );
    }
  };

  return (
    <div className="register-container">
      <h1>Register</h1>
      <form className="register-form" onSubmit={handleSubmit}>
        <div>
          <label>Email:</label><br />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <br />
        <div>
          <label>Password:</label><br />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <br />
        <div>
          <label>Confirm Password:</label><br />
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <br />
        <div>
          <label>Role:</label><br />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            <option value="volunteer">Volunteer</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <br />
        {error && <p className="register-error">{error}</p>}
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default RegisterPage;
