import React, { useState } from 'react';

const ActivityFeed = () => {
  const [interest, setInterest] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [results, setResults] = useState([]);

  const searchActivities = async () => {
    const params = new URLSearchParams({ interest, location, date });
    const res = await fetch(`http://localhost:3000/activities?${params}`);
    const data = await res.json();
    setResults(data);
  };

  const findNearby = async () => {
    const lat = 1.3521; // Example: Singapore
    const lng = 103.8198;
    const res = await fetch(`http://localhost:3000/activities/nearby?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <div>
      <h1>Find Activities</h1>

      <label>
        Interest:
        <input
          type="text"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        />
      </label>
      <br />
      <label>
        Location:
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>
      <br />
      <label>
        Date:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <br />
      <button onClick={searchActivities}>Search</button>
      <button onClick={findNearby}>Nearby</button>

      <ul>
        {results.map((a) => (
          <li key={a.id}>
            {a.title} – {a.date} – {a.location}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityFeed;
