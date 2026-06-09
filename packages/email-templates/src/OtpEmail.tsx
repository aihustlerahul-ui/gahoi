import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr } from '@react-email/components';

interface OtpEmailProps {
  otp: string;
  expiresInMin: number;
  lang?: 'en' | 'hi';
}

export function OtpEmail({ otp, expiresInMin, lang = 'en' }: OtpEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ color: '#B5620E', fontSize: 24 }}>
            {isHindi ? 'गहोई सारथी' : 'Gahoi Sarthi'}
          </Heading>
          <Text style={{ color: '#3D2E1A', fontSize: 16 }}>
            {isHindi
              ? `आपका OTP कोड: ${otp} — यह ${expiresInMin} मिनट में समाप्त होगा।`
              : `Your OTP code: ${otp} — expires in ${expiresInMin} minutes.`}
          </Text>
          <Hr style={{ borderColor: '#E8E0D0' }} />
          <Text style={{ color: '#8A7A60', fontSize: 12 }}>
            {isHindi
              ? 'यदि आपने यह अनुरोध नहीं किया, तो इस ईमेल को अनदेखा करें।'
              : 'If you did not request this, please ignore this email.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
