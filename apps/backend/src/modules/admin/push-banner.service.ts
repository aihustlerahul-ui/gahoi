import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? 'gahoi-sarthi';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type PushBannerContentType = (typeof ALLOWED_TYPES)[number];

function extensionForType(contentType: PushBannerContentType): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

export function getPublicImageUrl(r2Key: string): string {
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
  if (!publicBase) {
    throw new Error('R2_PUBLIC_URL is not configured. Push banner images require a public bucket URL.');
  }
  return `${publicBase}/${r2Key}`;
}

export async function createPushBannerUploadUrl(contentType: PushBannerContentType) {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }

  const r2Key = `push-campaigns/${uuidv4()}.${extensionForType(contentType)}`;
  const imageUrl = getPublicImageUrl(r2Key);

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      ContentType: contentType,
    }),
    { expiresIn: 15 * 60 }
  );

  return { uploadUrl, imageUrl, r2Key };
}
