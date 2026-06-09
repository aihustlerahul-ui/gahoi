// Populate mock environment variables for test runs
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
process.env.DIRECT_URL = 'postgresql://localhost:5432/test';
process.env.JWT_PRIVATE_KEY = 'mock_private_key';
process.env.JWT_PUBLIC_KEY = 'mock_public_key';
process.env.RESEND_API_KEY = 're_mock_key';
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_id';
process.env.RAZORPAY_KEY_SECRET = 'mock_secret';
process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'mock_google_id';
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3001/v1';
