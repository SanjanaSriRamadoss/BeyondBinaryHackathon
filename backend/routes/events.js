const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let activities = [
  {
    id: 1,
    title: "Yoga in the Park",
    interest: "Wellness",
    location: "Singapore",
    lat: 1.3521,
    lng: 103.8198,
    date: "2026-02-12"
  },
  {
    id: 2,
    title: "Coding Meetup",
    interest: "Tech",
    location: "Singapore",
    lat: 1.3000,
    lng: 103.8000,
    date: "2026-02-13"
  },
  {
    id: 3,
    title: "Poetry Open Mic Night",
    interest: "Arts",
    location: "Singapore",
    lat: 1.3100,
    lng: 103.8200,
    date: "2026-02-14"
  },
  {
    id: 4,
    title: "Community Beach Cleanup",
    interest: "Environment",
    location: "East Coast",
    lat: 1.3050,
    lng: 103.9300,
    date: "2026-02-15"
  },
  {
    id: 5,
    title: "Board Game Café Night",
    interest: "Games",
    location: "Bugis",
    lat: 1.2990,
    lng: 103.8550,
    date: "2026-02-16"
  },
  {
    id: 6,
    title: "Photography Walk",
    interest: "Photography",
    location: "Marina Bay",
    lat: 1.2830,
    lng: 103.8600,
    date: "2026-02-17"
  },
  {
    id: 7,
    title: "Startup Pitch Practice",
    interest: "Entrepreneurship",
    location: "One-North",
    lat: 1.2995,
    lng: 103.7876,
    date: "2026-02-18"
  },
  {
    id: 8,
    title: "K-Pop Dance Workshop",
    interest: "Dance",
    location: "Orchard",
    lat: 1.3048,
    lng: 103.8318,
    date: "2026-02-19"
  },
  {
    id: 9,
    title: "Mindfulness Meditation Circle",
    interest: "Wellness",
    location: "Tiong Bahru",
    lat: 1.2865,
    lng: 103.8280,
    date: "2026-02-20"
  },
  {
    id: 10,
    title: "Language Exchange Meetup",
    interest: "Languages",
    location: "Chinatown",
    lat: 1.2840,
    lng: 103.8430,
    date: "2026-02-21"
  }
];

// Filter by interest, location, date
app.get('/activities', (req, res) => {
  const { interest, location, date } = req.query;
  let results = activities;

  if (interest) results = results.filter(a => a.interest === interest);
  if (location) results = results.filter(a => a.location === location);
  if (date) results = results.filter(a => a.date === date);

  res.json(results);
});

// Location-based query (within 5km radius)
app.get('/activities/nearby', (req, res) => {
  const { lat, lng } = req.query;
  const radius = 0.05; // ~5km in degrees

  const nearby = activities.filter(a =>
    Math.abs(a.lat - lat) <= radius && Math.abs(a.lng - lng) <= radius
  );

  res.json(nearby);
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
