import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../db/prisma';

// Mock Resend email service
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: jest.fn().mockResolvedValue({ id: 'mock_email_id' }),
        },
      };
    }),
  };
});

// Mock Prisma client
jest.mock('../../../db/prisma', () => {
  return {
    prisma: {
      otpRequest: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    },
  };
});

describe('Auth Module — send-otp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 Bad Request if email format is invalid', async () => {
    const res = await request(app)
      .post('/v1/auth/send-otp')
      .send({ email: 'invalid-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('email');
  });

  it('should successfully generate and send OTP for a valid email', async () => {
    // Mock no active lockout
    (prisma.otpRequest.findFirst as jest.Mock).mockResolvedValue(null);
    
    // Mock user findUnique returning an existing user
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'mock-user-id',
      email: 'user@example.com',
    });

    // Mock database updateMany
    (prisma.otpRequest.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    // Mock database insertion of OTP Request
    (prisma.otpRequest.create as jest.Mock).mockResolvedValue({
      id: 'mock-otp-id',
      email: 'user@example.com',
      otpHash: 'mocked-hash',
      attempts: 0,
      lockedUntil: null,
      used: false,
    });

    const res = await request(app)
      .post('/v1/auth/send-otp')
      .send({ email: 'user@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('OTP sent');
    
    // Check database was queried and saved
    expect(prisma.otpRequest.findFirst).toHaveBeenCalled();
    expect(prisma.otpRequest.updateMany).toHaveBeenCalled();
    expect(prisma.otpRequest.create).toHaveBeenCalled();
  });

  it('should return 400 with generic error message if email is locked out', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // locked for 10 minutes
    
    // Mock active lockout record
    (prisma.otpRequest.findFirst as jest.Mock).mockResolvedValue({
      id: 'lockout-id',
      email: 'locked@example.com',
      lockedUntil: futureDate,
    });

    const res = await request(app)
      .post('/v1/auth/send-otp')
      .send({ email: 'locked@example.com' });

    // Lockout throws a business error in auth.service, which route maps to 400
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid or expired OTP');
  });
});
