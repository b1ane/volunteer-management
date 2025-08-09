const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../routes/notificationRoutes');

const app = express();
app.use(express.json());
app.use('/notifications', notificationRoutes);

describe('Notification API', () => {
  it('should return all notifications', async () => {
    const res = await request(app).get('/notifications');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('message');
  });
});
