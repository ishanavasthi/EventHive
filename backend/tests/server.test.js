const request = require('supertest');
const app = require('../src/server');

describe('API Health Check', () => {
  it('GET /health should return 200 and status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('UP');
  });
});