
//import React from 'react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

function LoginPage({ setIsLoggedIn }) {
  const navigate = useNavigate();

  //stores inputs locally 
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/login', {
        email: form.email,
        password: form.password
      });

      alert(res.data.message);

      localStorage.setItem('userEmail', res.data.email);
      localStorage.setItem('userRole', res.data.role);
      
      setIsLoggedIn(true);
      navigate('/profile', { state: { email: res.data.email } });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>Email:</label>
        <input 
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required 
        />

        <label>Password:</label>
        <input 
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required 
        />

        {error && <p className="login-error">{error}</p>}
        <button type="submit">Login</button>
      </form>

      <hr className="login-divider" />
      <p className="login-register">Don’t have an account?</p>
      <button onClick={() => navigate('/register')}>Register</button>
    </div>
  );
}

export default LoginPage;
