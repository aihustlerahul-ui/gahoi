import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../db/prisma';
import { sendBroadcast } from '../../../lib/push.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { verifyToken } from '../../../lib/jwt';

// Mock DB
jest.mock('../../../db/prisma', () => ({
  prisma: {
    pushCampaign: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock Push Service
jest.mock('../../../lib/push.service', () => ({
  sendBroadcast: jest.fn(),
}));

// Mock AWS S3 client and Signed URL helpers
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({})),
    PutObjectCommand: jest.fn().mockImplementation(() => ({})),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

// Mock JWT module (automatically mocks all exports including verifyToken)
jest.mock('../../../lib/jwt');

describe('Admin Push Campaigns & Banners API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.R2_PUBLIC_URL = 'https://assets.example.com';
    process.env.R2_ACCOUNT_ID = 'mock-account-id';
    process.env.R2_ACCESS_KEY_ID = 'mock-access-key-id';
    process.env.R2_SECRET_ACCESS_KEY = 'mock-secret-access-key';

    // Establish the mock implementation for verifyToken for this test suite
    (verifyToken as jest.Mock).mockImplementation((token: string) => {
      if (token === 'valid-admin-token') {
        return { sub: 'admin-123', role: 'SuperAdmin', type: 'admin' };
      }
      if (token === 'user-token') {
        return { sub: 'user-123', role: 'user', type: 'user' };
      }
      throw new Error('Invalid token');
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('POST /v1/admin/push/upload-url', () => {
    it('should return 401 Unauthorized if no token provided', async () => {
      const res = await request(app)
        .post('/v1/admin/push/upload-url')
        .send({ contentType: 'image/png' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 403 Forbidden if user token is provided instead of admin token', async () => {
      const res = await request(app)
        .post('/v1/admin/push/upload-url')
        .set('Authorization', 'Bearer user-token')
        .send({ contentType: 'image/png' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Forbidden: Admin token required');
    });

    it('should return 400 if contentType is missing or invalid', async () => {
      const res = await request(app)
        .post('/v1/admin/push/upload-url')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({ contentType: 'image/gif' }); // invalid type

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return a signed upload URL and public image URL when valid request', async () => {
      const mockSignedUrl = 'https://r2-upload.example.com/signed-path-here';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      const res = await request(app)
        .post('/v1/admin/push/upload-url')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({ contentType: 'image/png' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBe(mockSignedUrl);
      expect(res.body.data.imageUrl).toContain('https://assets.example.com/push-campaigns/');
      expect(res.body.data.imageUrl.endsWith('.png')).toBe(true);
      expect(res.body.data.r2Key).toBeDefined();
    });

    it('should return 400 if R2_PUBLIC_URL is not configured', async () => {
      delete process.env.R2_PUBLIC_URL;

      const res = await request(app)
        .post('/v1/admin/push/upload-url')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({ contentType: 'image/png' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('R2_PUBLIC_URL is not configured');
    });
  });

  describe('POST /v1/admin/push/broadcast', () => {
    it('should send broadcast notification and record campaign', async () => {
      (sendBroadcast as jest.Mock).mockResolvedValue(42); // 42 targeted users
      (prisma.pushCampaign.create as jest.Mock).mockResolvedValue({
        id: 'campaign-123',
        title: 'Promotion Title',
        body: 'Promotion body message details',
        data: { screen: 'matches', imageUrl: 'https://assets.example.com/banner.jpg' },
        recipientCount: 42,
        sentAt: new Date(),
      });

      const res = await request(app)
        .post('/v1/admin/push/broadcast')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          title: 'Promotion Title',
          body: 'Promotion body message details',
          imageUrl: 'https://assets.example.com/banner.jpg',
          data: { screen: 'matches' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.campaignId).toBe('campaign-123');
      expect(res.body.data.recipientCount).toBe(42);

      expect(sendBroadcast).toHaveBeenCalledWith({
        title: 'Promotion Title',
        body: 'Promotion body message details',
        imageUrl: 'https://assets.example.com/banner.jpg',
        data: { screen: 'matches' },
      });

      expect(prisma.pushCampaign.create).toHaveBeenCalled();
    });
  });

  describe('GET /v1/admin/push/campaigns', () => {
    it('should return past campaigns list', async () => {
      const mockCampaigns = [
        {
          id: 'camp-1',
          title: 'First campaign',
          body: 'First body',
          sentAt: new Date().toISOString(),
          recipientCount: 10,
        },
      ];
      (prisma.pushCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);

      const res = await request(app)
        .get('/v1/admin/push/campaigns')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCampaigns);
      expect(prisma.pushCampaign.findMany).toHaveBeenCalled();
    });
  });
});
