import * as React from 'react';
import { render } from '@react-email/components';
import fs from 'fs';
import path from 'path';

import { WeeklyDigestEmail } from './WeeklyDigestEmail';

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
  console.log('Resending Weekly Match Digest emails...');
  
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

  // Try sending with a simpler subject line (without square brackets, which can trigger spam filters sometimes)
  await sendEmail('Weekly Match Digest - Gahoi Sarthi', await render(weeklyDigestEn));
  await sendEmail('साप्ताहिक मैच डाइजेस्ट - गहोई सारथी', await render(weeklyDigestHi));

  console.log('Done resending!');
}

run();
