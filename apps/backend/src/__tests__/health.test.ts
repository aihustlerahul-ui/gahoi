import request from 'supertest';
import app from '../index';

describe('Health Check Endpoint', () => {
  it('should return 200 and success:true', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        version: '1.0.0',
      },
      error: null,
      meta: {},
    });
  });
});
