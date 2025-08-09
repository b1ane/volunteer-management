import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function VerifyEmailPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying your email...');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get('token');

    if (!token) {
      setMessage('Invalid verification link.');
      return;
    }

    axios
      .get(`http://localhost:5000/verify-email?token=${token}`)
      .then(() => {
        setMessage('Your email has been verified!');
        setSuccess(true);
        navigate('/')
      })
      .catch((err) => {
        console.error('Verification failed:', err);
        setMessage('Verification failed. The link may be invalid or expired.');
        setSuccess(false);
      });
  }, [search, navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>{success ? 'Email Verified!' : 'Verification Failed'}</h1>
      <p>{message}</p>
    </div>
  );
}

export default VerifyEmailPage;
