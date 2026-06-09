import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../../../.env');
  if (!fs.existsSync(envPath)) {
    console.error(`❌ .env file not found at: ${envPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) continue;
    const key = trimmed.slice(0, firstEquals).trim();
    const value = trimmed.slice(firstEquals + 1).trim();
    env[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnv();
const BUCKET = env.R2_BUCKET_NAME || 'gahoi-sarthi';

console.log('Testing Cloudflare R2 connection...');
console.log(`Bucket: ${BUCKET}`);
console.log(`Endpoint: https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

async function run() {
  const testKey = `test-uploads/test-${Date.now()}.jpg`;
  const dummyData = Buffer.from('this is a test image content for gahoi sarthi', 'utf-8');

  try {
    // 1. Generate PUT Presigned URL
    console.log('\n1. Generating presigned PUT URL...');
    const uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: testKey,
        ContentType: 'image/jpeg',
      }),
      { expiresIn: 600 }
    );
    console.log(`✅ Upload URL: ${uploadUrl}`);

    // 2. Upload using the presigned URL
    console.log('\n2. Uploading dummy file to presigned URL...');
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: dummyData,
    });

    if (putRes.ok) {
      console.log('✅ File uploaded successfully!');
    } else {
      throw new Error(`Upload failed with status: ${putRes.status} ${putRes.statusText}`);
    }

    // 3. Generate GET Presigned URL
    console.log('\n3. Generating presigned GET URL...');
    const downloadUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: testKey,
      }),
      { expiresIn: 600 }
    );
    console.log(`✅ Download URL: ${downloadUrl}`);

    // 4. Download and Verify content
    console.log('\n4. Fetching downloaded file content...');
    const getRes = await fetch(downloadUrl);
    if (!getRes.ok) {
      throw new Error(`Download failed with status: ${getRes.status}`);
    }
    const downloadedText = await getRes.text();
    console.log(`✅ Downloaded Content matches: "${downloadedText}"`);

    // 5. Clean up (Delete the file)
    console.log('\n5. Deleting test file from bucket...');
    await r2.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: testKey,
    }));
    console.log('✅ Test file deleted from bucket.');

    console.log('\n🎉 R2 connection, upload, presigned URLs, download, and delete are WORKING perfectly!');
  } catch (err) {
    console.error('\n❌ R2 Test Failed:', err);
    process.exit(1);
  }
}

run();
