import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../db/prisma';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? 'gahoi-sarthi';
const SIGNED_URL_EXPIRY = 2 * 60 * 60; // 2 hours
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function getUploadUrl(userId: string): Promise<{
  uploadUrl: string;
  galleryId: string;
  r2Key: string;
}> {
  // Check gallery count — max 10 photos
  const existing = await prisma.profileGallery.count({ where: { profileId: userId } });
  if (existing >= 10) {
    throw new Error('Maximum 10 photos allowed');
  }

  const galleryId = uuidv4();
  const r2Key = `profiles/${userId}/${uuidv4()}.jpg`;

  // Create presigned upload URL (PUT) with content-length restriction
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      ContentType: 'image/jpeg',
    }),
    {
      expiresIn: 15 * 60, // 15 minutes for upload
    }
  );

  // Create gallery record in pending state
  await prisma.profileGallery.create({
    data: {
      id: galleryId,
      profileId: userId,
      r2Key,
      adminStatus: 'pending',
      sortOrder: existing,
    },
  });

  return { uploadUrl, galleryId, r2Key };
}

export async function getGalleryWithSignedUrls(userId: string): Promise<
  { id: string; signedUrl: string; visibility: string; sortOrder: number; adminStatus: string }[]
> {
  const gallery = await prisma.profileGallery.findMany({
    where: { profileId: userId },
    orderBy: { sortOrder: 'asc' },
  });

  return Promise.all(
    gallery.map(async (item) => {
      const signedUrl = await getSignedUrl(
        r2,
        new GetObjectCommand({ Bucket: BUCKET, Key: item.r2Key }),
        { expiresIn: SIGNED_URL_EXPIRY }
      );
      return {
        id: item.id,
        signedUrl,
        visibility: item.visibility,
        sortOrder: item.sortOrder,
        adminStatus: item.adminStatus,
      };
    })
  );
}

export async function getSignedImageUrl(r2Key: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: r2Key }),
    { expiresIn: SIGNED_URL_EXPIRY }
  );
}

export async function deleteGalleryImage(userId: string, galleryId: string): Promise<void> {
  const item = await prisma.profileGallery.findFirst({
    where: { id: galleryId, profileId: userId },
  });
  if (!item) throw new Error('Image not found');

  // Delete from R2
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: item.r2Key }));

  // Delete DB record
  await prisma.profileGallery.delete({ where: { id: galleryId } });
}

export async function confirmUpload(galleryId: string, userId: string): Promise<void> {
  // Called after client confirms successful upload to R2
  await prisma.profileGallery.updateMany({
    where: { id: galleryId, profileId: userId },
    data: { adminStatus: 'pending' }, // stays pending until admin approves
  });
}
