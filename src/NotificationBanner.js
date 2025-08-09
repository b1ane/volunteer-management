import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationBanner = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/notifications')
      .then(res => setNotifications(res.data))
      .catch(err => {
        console.error('Failed to fetch notifications:', err);
        setNotifications([]);
      });
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#fff3cd',
      color: '#856404',
      border: '1px solid #ffeeba',
      padding: '1rem',
      borderRadius: '0 0 0 8px'
    }}>
      <strong>🔔 Notifications:</strong>
      <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
        {notifications.map((note, index) => (
          <li key={index}>{note.message || note}</li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationBanner;
