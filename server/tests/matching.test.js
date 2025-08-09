const request = require('supertest');
const express = require('express');
const matchingRoutes = require('../routes/matchingRoutes');

const app = express();
app.use(express.json());
app.use('/match', matchingRoutes);

describe('Volunteer Matching API', () => {
  it('should return matching events for a valid volunteer', async () => {
    const res = await request(app).get('/match/1'); // Alice
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name).toBe('Food Drive');
  });

  it('should return 404 for non-existent volunteer', async () => {
    const res = await request(app).get('/match/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Volunteer not found');
  });

  it('should return empty array if no matching events', async () => {
    const res = await request(app).get('/match/2'); 
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
