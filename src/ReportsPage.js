// src/ReportsPage.jsx
import React from 'react';

const BASE = 'http://localhost:5000';

function download(url, filename) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    })
    .then(blob => {
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    })
    .catch(err => alert(err.message));
}

export default function ReportsPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', maxWidth: 720, margin: '0 auto' }}>
      <h1>Reports</h1>
      <p>Download reports generated from the database.</p>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <button onClick={() => download(`${BASE}/reports/volunteers.csv`, 'volunteers_history.csv')}>
          Download Volunteers + History (CSV)
        </button>

        <button onClick={() => download(`${BASE}/reports/events.csv`, 'events_assignments.csv')}>
          Download Events + Assignments (CSV)
        </button>

        <button onClick={() => download(`${BASE}/reports/summary.pdf`, 'volunteer_reports_summary.pdf')}>
          Download Combined Summary (PDF)
        </button>
      </div>
    </div>
  );
}
