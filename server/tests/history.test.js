const request = require('supertest');
const express = require('express');
const historyRoutes = require('../routes/historyRoutes');

const app = express();
app.use(express.json());
app.use('/history', historyRoutes);

describe('Volunteer History API', () => {
  describe('GET /history/:volunteerId', () => {
    it('should return all history for a volunteer', async () => {
      const res = await request(app).get('/history/123');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /history', () => {
    it('should create a new history record with valid data', async () => {
      const record = {
        volunteerId: '123',
        eventId: '789',
        date: '2024-05-01',
        hours: 3,
        role: 'Greeter',
        notes: 'Friendly and helpful.'
      };
      const res = await request(app).post('/history').send(record);
      expect(res.statusCode).toBe(201);
      expect(res.body.volunteerId).toBe(record.volunteerId);
    });
    it('should fail if required fields are missing', async () => {
      const res = await request(app).post('/history').send({});
      expect(res.statusCode).toBe(400);
    });
    it('should fail if hours is out of range', async () => {
      const record = {
        volunteerId: '123',
        eventId: '789',
        date: '2024-05-01',
        hours: 0.1,
        role: 'Greeter'
      };
      const res = await request(app).post('/history').send(record);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /history/:id', () => {
    it('should update a history record with valid data', async () => {
      const record = {
        volunteerId: '123',
        eventId: '456',
        date: '2024-06-01',
        hours: 2,
        role: 'Helper',
        notes: 'Updated notes.'
      };
      const res = await request(app).put('/history/1').send(record);
      expect(res.statusCode).toBe(200);
      expect(res.body.notes).toBe('Updated notes.');
    });
    it('should return 404 for non-existent record', async () => {
      const record = {
        volunteerId: '123',
        eventId: '456',
        date: '2024-06-01',
        hours: 2,
        role: 'Helper'
      };
      const res = await request(app).put('/history/999').send(record);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /history/:id', () => {
    it('should delete a history record', async () => {
      const res = await request(app).delete('/history/1');
      expect(res.statusCode).toBe(204);
    });
    it('should return 404 for non-existent record', async () => {
      const res = await request(app).delete('/history/999');
      expect(res.statusCode).toBe(404);
    });
  });
}); 