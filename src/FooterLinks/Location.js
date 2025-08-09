import React from 'react';

const Location = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Location</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        Where are we located? We are based in Houston, Texas, at the University of Houston campus. Our office is situated in the heart of the campus, making it easily accessible for students and faculty alike. We are committed to serving our local community and providing a platform that connects volunteers with opportunities to make a difference.
      </p>
      <p className="text-gray-700 leading-relaxed">
        Our physical address is:
        <br />
        University of Houston<br />
        4800 Calhoun Rd, Houston, TX 77004<br />
        United States
      </p>
    </div>
  );
};

export default Location;