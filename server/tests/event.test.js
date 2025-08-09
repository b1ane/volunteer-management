const request = require('supertest');
const express = require('express');
const eventRoutes = require('../routes/eventRoutes');

const app = express();
app.use(express.json());
app.use('/events', eventRoutes);

describe('Event Management API', () => {
  describe('GET /events', () => {
    it('should return all events', async () => {
      const res = await request(app).get('/events');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter events by required skill', async () => {
      const res = await request(app).get('/events').query({ skill: 'organization' });
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].requiredSkills).toContain('organization');
    });

    it('should filter events by urgency', async () => {
      const res = await request(app).get('/events').query({ urgency: 'high' });
      expect(res.statusCode).toBe(200);
      expect(res.body.every(e => e.urgency === 'high')).toBe(true);
    });
  });

  describe('POST /events', () => {
    it('should create a new event with valid data', async () => {
      const event = {
        name: 'Blood Drive',
        location: 'Library',
        urgency: 'medium',
        requiredSkills: ['communication'],
        details: 'Assist with donor registration.'
      };
      const res = await request(app).post('/events').send(event);
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe(event.name);
    });

    it('should fail if required fields are missing', async () => {
      const res = await request(app).post('/events').send({});
      expect(res.statusCode).toBe(400);
    });

    it('should fail if urgency is invalid', async () => {
      const event = {
        name: 'Test',
        location: 'Test',
        urgency: 'urgent',
        requiredSkills: ['test']
      };
      const res = await request(app).post('/events').send(event);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /events/:id', () => {
    it('should return an event by ID', async () => {
      const res = await request(app).get('/events/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe('1');
    });
    it('should return 404 for non-existent event', async () => {
      const res = await request(app).get('/events/999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /events/:id', () => {
    it('should update an event with valid data', async () => {
      const event = {
        name: 'Updated Event',
        location: 'Updated Location',
        urgency: 'low',
        requiredSkills: ['updated'],
        details: 'Updated details.'
      };
      const res = await request(app).put('/events/1').send(event);
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Event');
    });
    it('should return 404 for non-existent event', async () => {
      const event = {
        name: 'Test',
        location: 'Test',
        urgency: 'low',
        requiredSkills: ['test']
      };
      const res = await request(app).put('/events/999').send(event);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should delete an event', async () => {
      const res = await request(app).delete('/events/1');
      expect(res.statusCode).toBe(204);
    });
    it('should return 404 for non-existent event', async () => {
      const res = await request(app).delete('/events/999');
      expect(res.statusCode).toBe(404);
    });
  });

});

