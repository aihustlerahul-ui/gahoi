import jwt from 'jsonwebtoken';

const PRIVATE_KEY = Buffer.from(process.env.JWT_PRIVATE_KEY ?? '', 'base64').toString('utf8');
const PUBLIC_KEY = Buffer.from(process.env.JWT_PUBLIC_KEY ?? '', 'base64').toString('utf8');

export function issueAccessToken(userId: string, tier: string): string {
  return jwt.sign({ sub: userId, tier }, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '15m',
  });
}

export function issueAdminToken(adminId: string, role: string): string {
  return jwt.sign({ sub: adminId, role, type: 'admin' }, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '8h', // Longer session for admin panel
  });
}

export function issueRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '30d',
  });
}

export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }) as jwt.JwtPayload;
}
