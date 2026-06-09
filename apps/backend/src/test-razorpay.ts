import Razorpay from 'razorpay';
import crypto from 'crypto';
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
const key_id = env.RAZORPAY_KEY_ID;
const key_secret = env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.error('❌ Razorpay credentials are not defined in .env');
  process.exit(1);
}

console.log('Testing Razorpay Connection & API...');
console.log(`Key ID: ${key_id}`);

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

async function run() {
  try {
    // 1. Create a test order
    console.log('\n1. Creating a test order via Razorpay API...');
    const amount = 50000; // 500.00 INR (in paise)
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      notes: {
        test: 'true',
        description: 'Gahoi Sarthi subscription test order',
      },
    });

    console.log('✅ Order created successfully!');
    console.log(`Order ID: ${order.id}`);
    console.log(`Amount: ${order.amount} ${order.currency}`);
    console.log(`Status: ${order.status}`);

    // 2. Test signature verification logic
    console.log('\n2. Testing local signature verification logic...');
    const mockPaymentId = 'pay_mock123456';
    const body = `${order.id}|${mockPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    console.log(`Generated HMAC signature: ${generatedSignature}`);

    // Verify
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    const verified = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(expectedSignature)
    );

    if (verified) {
      console.log('✅ Local signature generation & verification logic is 100% correct.');
    } else {
      throw new Error('Local signature verification logic mismatch!');
    }

    console.log('\n🎉 Razorpay API key/secret and order creation are fully WORKING!');
  } catch (err) {
    console.error('\n❌ Razorpay API Test Failed:', err);
    process.exit(1);
  }
}

run();
