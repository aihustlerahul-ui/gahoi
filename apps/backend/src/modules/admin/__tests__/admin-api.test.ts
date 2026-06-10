import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../db/prisma';
import { verifyToken } from '../../../lib/jwt';

jest.mock('../../../db/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
    profileReport: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profile: { findUnique: jest.fn(), update: jest.fn() },
    admin: { findMany: jest.fn() },
    successStory: { findMany: jest.fn() },
    interest: { findMany: jest.fn(), groupBy: jest.fn() },
    adminActionLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({}) },
  })),
}));

jest.mock('@react-email/components', () => ({
  render: jest.fn().mockResolvedValue('<html></html>'),
}));

jest.mock('@gahoisarthi/email-templates', () => ({
  ProfileApprovedEmail: () => null,
  ProfileRejectedEmail: () => null,
  ReportOutcomeEmail: () => null,
}));

jest.mock('../../../lib/jwt');

describe('Admin API — role guard & endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockImplementation((token: string) => {
      if (token === 'super-admin-token') {
        return { sub: 'admin-super', role: 'super_admin', type: 'admin' };
      }
      if (token === 'moderator-token') {
        return { sub: 'admin-mod', role: 'moderator', type: 'admin' };
      }
      throw new Error('Invalid token');
    });
  });

  it('moderator cannot access GET /admin/users', async () => {
    const res = await request(app)
      .get('/v1/admin/users')
      .set('Authorization', 'Bearer moderator-token');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('insufficient admin role');
  });

  it('super_admin can access GET /admin/users', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/v1/admin/users')
      .set('Authorization', 'Bearer super-admin-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('moderator cannot POST /admin/email/broadcast', async () => {
    const res = await request(app)
      .post('/v1/admin/email/broadcast')
      .set('Authorization', 'Bearer moderator-token')
      .send({ segment: 'free', subject: 'Test', bodyHtml: '<p>Hi</p>' });

    expect(res.status).toBe(403);
  });

  it('resolveReport accepts warn action', async () => {
    const reportId = 'report-1';
    (prisma.profileReport.findUnique as jest.Mock).mockResolvedValue({
      id: reportId,
      reporterId: 'reporter-1',
      reportedId: 'reported-1',
      status: 'open',
    });
    (prisma.profileReport.update as jest.Mock).mockResolvedValue({
      id: reportId,
      status: 'resolved',
    });
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'reported-1',
      user: { email: 'reported@test.com', preferredLanguage: 'en' },
    });

    const res = await request(app)
      .post(`/v1/admin/reports/${reportId}/resolve`)
      .set('Authorization', 'Bearer moderator-token')
      .send({ action: 'warn' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.profileReport.update).toHaveBeenCalledWith({
      where: { id: reportId },
      data: { status: 'resolved' },
    });
  });

  it('resolveReport accepts ban action and suspends user', async () => {
    const reportId = 'report-2';
    (prisma.profileReport.findUnique as jest.Mock).mockResolvedValue({
      id: reportId,
      reporterId: 'reporter-1',
      reportedId: 'reported-1',
      status: 'open',
    });
    (prisma.profileReport.update as jest.Mock).mockResolvedValue({
      id: reportId,
      status: 'resolved',
    });
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'reporter-1',
      user: { email: 'reporter@test.com', preferredLanguage: 'en' },
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (prisma.profile.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post(`/v1/admin/reports/${reportId}/resolve`)
      .set('Authorization', 'Bearer moderator-token')
      .send({ action: 'ban' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
