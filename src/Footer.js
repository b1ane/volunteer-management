import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const linkStyle = {
    margin: '0 0.5rem',
    padding: '0.5rem 1.2rem',
    borderRadius: '9999px',
    backgroundColor: '#54585A',
    color: 'white',
    textDecoration: 'none',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: '0.9rem',
    display: 'inline-block',
    textAlign: 'center',
  };

  const footerStyle = {
    backgroundColor: '#54585A',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'center',
    borderTop: '1px solid #444',
    borderRadius: '0 0 8px 8px',
  };

  return (
    <footer style={footerStyle}>
    <Link to="/FooterLinks/AboutUs" style={linkStyle}>About Us</Link>
    <Link to="/FooterLinks/Location" style={linkStyle}>Location</Link>
    <Link to="/FooterLinks/FAQ" style={linkStyle}>FAQ</Link>
    <Link to="/FooterLinks/ContactUs" style={linkStyle}>Contact Us</Link>
    </footer>
  );
};

export default Footer;