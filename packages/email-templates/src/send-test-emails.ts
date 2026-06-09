import * as React from 'react';
import { render } from '@react-email/components';
import fs from 'fs';
import path from 'path';

// Import all templates
import { OtpEmail } from './OtpEmail';
import { InterestReceivedEmail } from './InterestReceivedEmail';
import { InterestAcceptedEmail } from './InterestAcceptedEmail';
import { InterestDeclinedEmail } from './InterestDeclinedEmail';
import { ProfileApprovedEmail } from './ProfileApprovedEmail';
import { PhotoRejectedEmail } from './PhotoRejectedEmail';
import { SubscriptionEmail } from './SubscriptionEmail';
import { SubscriptionExpiryEmail } from './SubscriptionExpiryEmail';
import { WeeklyDigestEmail } from './WeeklyDigestEmail';

// Parse .env file
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
const RESEND_API_KEY = env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL || 'onboarding@justhustle.in';
const TARGET_EMAIL = 'aihustlerahul@gmail.com';

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not defined in .env');
  process.exit(1);
}

console.log(`Using Resend From Email: ${RESEND_FROM_EMAIL}`);
console.log(`Sending to: ${TARGET_EMAIL}\n`);

async function sendEmail(subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [TARGET_EMAIL],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Sent: "${subject}" -> ID: ${(data as any).id}`);
    } else {
      console.error(`❌ Failed: "${subject}" ->`, data);
    }
  } catch (err) {
    console.error(`❌ Error sending "${subject}":`, err);
  }
}

async function run() {
  // 1. OTP Email
  const otpEn = React.createElement(OtpEmail, { otp: '482019', expiresInMin: 10, lang: 'en' });
  const otpHi = React.createElement(OtpEmail, { otp: '482019', expiresInMin: 10, lang: 'hi' });
  await sendEmail('[Test] OTP Verification (English)', await render(otpEn));
  await sendEmail('[Test] ओटीपी सत्यापन (Hindi)', await render(otpHi));

  // 2. Profile Approved Email
  const profileApprovedEn = React.createElement(ProfileApprovedEmail, {
    userName: 'Rahul',
    profileLink: 'https://gahoisarthi.in/profile/rahul',
    lang: 'en',
  });
  const profileApprovedHi = React.createElement(ProfileApprovedEmail, {
    userName: 'राहुल',
    profileLink: 'https://gahoisarthi.in/profile/rahul',
    lang: 'hi',
  });
  await sendEmail('[Test] Profile Approved! (English)', await render(profileApprovedEn));
  await sendEmail('[Test] प्रोफ़ाइल स्वीकृत! (Hindi)', await render(profileApprovedHi));

  // 3. Subscription Activated Email
  const subscriptionEn = React.createElement(SubscriptionEmail, {
    userName: 'Rahul',
    planName: 'Premium Gold Plus',
    amount: 1499,
    expiryDate: 'June 09, 2027',
    lang: 'en',
  });
  const subscriptionHi = React.createElement(SubscriptionEmail, {
    userName: 'राहुल',
    planName: 'प्रीमियम गोल्ड प्लस',
    amount: 1499,
    expiryDate: '09 जून, 2027',
    lang: 'hi',
  });
  await sendEmail('[Test] Subscription Activated! (English)', await render(subscriptionEn));
  await sendEmail('[Test] सदस्यता सक्रिय हो गई है! (Hindi)', await render(subscriptionHi));

  // 4. Subscription Expiry Email
  const expiryEn = React.createElement(SubscriptionExpiryEmail, {
    userName: 'Rahul',
    daysLeft: 7,
    renewLink: 'https://gahoisarthi.in/premium',
    lang: 'en',
  });
  const expiryHi = React.createElement(SubscriptionExpiryEmail, {
    userName: 'राहुल',
    daysLeft: 7,
    renewLink: 'https://gahoisarthi.in/premium',
    lang: 'hi',
  });
  await sendEmail('[Test] Subscription Expiring Soon (English)', await render(expiryEn));
  await sendEmail('[Test] प्रीमियम समाप्त होने वाला है (Hindi)', await render(expiryHi));

  // 5. Interest Received Email
  const interestReceivedEn = React.createElement(InterestReceivedEmail, {
    senderName: 'Preeti Gahoi',
    senderAge: 26,
    senderCity: 'Gwalior',
    senderEducation: 'MBA',
    senderOccupation: 'Software Engineer',
    profileLink: 'https://gahoisarthi.in/profile/preeti',
    lang: 'en',
  });
  const interestReceivedHi = React.createElement(InterestReceivedEmail, {
    senderName: 'प्रीति गहोई',
    senderAge: 26,
    senderCity: 'ग्वालियर',
    senderEducation: 'एमबीए',
    senderOccupation: 'सॉफ्टवेयर इंजीनियर',
    profileLink: 'https://gahoisarthi.in/profile/preeti',
    lang: 'hi',
  });
  await sendEmail('[Test] New Interest Received (English)', await render(interestReceivedEn));
  await sendEmail('[Test] नया रुचि अनुरोध प्राप्त हुआ (Hindi)', await render(interestReceivedHi));

  // 6. Interest Accepted Email
  const interestAcceptedEn = React.createElement(InterestAcceptedEmail, {
    receiverName: 'Preeti Gahoi',
    senderName: 'Rahul',
    contactLink: 'https://gahoisarthi.in/chat/preeti',
    lang: 'en',
  });
  const interestAcceptedHi = React.createElement(InterestAcceptedEmail, {
    receiverName: 'प्रीति गहोई',
    senderName: 'राहुल',
    contactLink: 'https://gahoisarthi.in/chat/preeti',
    lang: 'hi',
  });
  await sendEmail('[Test] Interest Request Accepted! Match Found (English)', await render(interestAcceptedEn));
  await sendEmail('[Test] रुचि अनुरोध स्वीकार! मिलान मिला (Hindi)', await render(interestAcceptedHi));

  // 7. Interest Declined Email
  const interestDeclinedEn = React.createElement(InterestDeclinedEmail, {
    receiverName: 'Preeti Gahoi',
    senderName: 'Rahul',
    lang: 'en',
  });
  const interestDeclinedHi = React.createElement(InterestDeclinedEmail, {
    receiverName: 'प्रीति गहोई',
    senderName: 'राहुल',
    lang: 'hi',
  });
  await sendEmail('[Test] Request Update (English)', await render(interestDeclinedEn));
  await sendEmail('[Test] अनुरोध अपडेट (Hindi)', await render(interestDeclinedHi));

  // 8. Photo Rejected Email
  const photoRejectedEn = React.createElement(PhotoRejectedEmail, {
    userName: 'Rahul',
    reason: 'Blurry or low resolution photo. Please upload a clear passport-style photo.',
    uploadLink: 'https://gahoisarthi.in/profile/edit',
    lang: 'en',
  });
  const photoRejectedHi = React.createElement(PhotoRejectedEmail, {
    userName: 'राहुल',
    reason: 'धुंधली या कम रिज़ॉल्यूशन वाली तस्वीर। कृपया एक स्पष्ट पासपोर्ट आकार की तस्वीर अपलोड करें।',
    uploadLink: 'https://gahoisarthi.in/profile/edit',
    lang: 'hi',
  });
  await sendEmail('[Test] Action Required: Photo Rejected (English)', await render(photoRejectedEn));
  await sendEmail('[Test] कार्रवाई आवश्यक: फोटो अस्वीकृत (Hindi)', await render(photoRejectedHi));

  // 9. Weekly Digest Email
  const weeklyDigestEn = React.createElement(WeeklyDigestEmail, {
    userName: 'Rahul',
    matches: [
      { name: 'Pooja Gahoi', age: 25, city: 'Jhansi', education: 'B.Tech', matchScore: 92 },
      { name: 'Nisha Gupta', age: 27, city: 'Bhopal', education: 'M.Com', matchScore: 88 },
      { name: 'Kirti Gahoi', age: 24, city: 'Indore', education: 'B.Pharmacy', matchScore: 85 },
    ],
    viewMatchesLink: 'https://gahoisarthi.in/matches',
    lang: 'en',
  });
  const weeklyDigestHi = React.createElement(WeeklyDigestEmail, {
    userName: 'राहुल',
    matches: [
      { name: 'पूजा गहोई', age: 25, city: 'झांसी', education: 'बी.टेक', matchScore: 92 },
      { name: 'निशा गुप्ता', age: 27, city: 'भोपाल', education: 'एम.कॉम', matchScore: 88 },
      { name: 'कीर्ति गहोई', age: 24, city: 'इंदौर', education: 'बी.फार्मेसी', matchScore: 85 },
    ],
    viewMatchesLink: 'https://gahoisarthi.in/matches',
    lang: 'hi',
  });
  await sendEmail('[Test] Weekly Match Digest (English)', await render(weeklyDigestEn));
  await sendEmail('[Test] साप्ताहिक मैच डाइजेस्ट (Hindi)', await render(weeklyDigestHi));

  console.log('\n🎉 Done sending all emails!');
}

run();
