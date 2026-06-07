import request from 'supertest';
import app from '../server.js';

describe('Server', () => {
  test('GET / responds with ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
