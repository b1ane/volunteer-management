import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = ({ isLoggedIn, setIsLoggedIn }) => {
    const navigate = useNavigate();
    const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');  
  };
    const linkStyle = {
        margin: '0 0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        backgroundColor: '#FFFFFF',
        color: '#C8102E',
        textDecoration: 'none',
        fontWeight: 'bold',
    };
        const signOutStyle = {
        ...linkStyle,
        backgroundColor: '#FFCCCC',
        border: 'none',
        cursor: 'pointer'
    };

  return (
    <header style={{
      background: '#54585A',
      padding: '1rem',
      borderBottom: '1px solid #ddd',
      borderRadius: '8px 8px 0 0',
    }}>
      <nav>
        {!isLoggedIn && (
                  <>
            <Link to="/" style={linkStyle}>Login</Link>
            <Link to="/register" style={linkStyle}>Register</Link>
          </>
        )}
        {isLoggedIn && (
          <>
            <Link to="/profile" style={linkStyle}>Profile</Link>
            <Link to="/events" style={linkStyle}>Events</Link>
            <Link to="/volunteerhistory" style={linkStyle}>History</Link>
            <Link to="/match" style={linkStyle}>Match</Link>
            <Link to="/upcomingevents" style={linkStyle}>My Upcoming Events</Link>
            <button 
              onClick={handleLogout}
              style={signOutStyle}
            >
              Sign Out
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default NavBar;