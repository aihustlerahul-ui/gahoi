import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Button, Section } from '@react-email/components';

interface ProfileRejectedEmailProps {
  userName: string;
  reason: string;
  profileLink: string;
  lang?: 'en' | 'hi';
}

export function ProfileRejectedEmail({
  userName,
  reason,
  profileLink,
  lang = 'en',
}: ProfileRejectedEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container
          style={{
            maxWidth: 480,
            margin: '0 auto',
            padding: '40px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E8E0D0',
          }}
        >
          <Heading style={{ color: '#D32F2F', fontSize: 22, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — प्रोफ़ाइल अस्वीकृत' : 'Gahoi Sarthi — Profile Rejected'}
          </Heading>

          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते ${userName}, आपकी प्रोफ़ाइल समीक्षा के दौरान अस्वीकृत कर दी गई है।`
              : `Hello ${userName}, your profile was rejected during moderation.`}
          </Text>

          <Section
            style={{
              margin: '16px 0',
              padding: '12px 16px',
              backgroundColor: '#FFEBEE',
              borderRadius: '6px',
              borderLeft: '4px solid #D32F2F',
            }}
          >
            <Text style={{ color: '#C62828', fontSize: 14, margin: '0' }}>
              <strong>{isHindi ? 'कारण / Reason:' : 'Reason:'}</strong> {reason}
            </Text>
          </Section>

          <Text style={{ color: '#3D2E1A', fontSize: 15, lineHeight: '22px', margin: '16px 0' }}>
            {isHindi
              ? 'कृपया अपनी प्रोफ़ाइल अपडेट करें और पुनः समीक्षा के लिए जमा करें।'
              : 'Please update your profile and resubmit for review.'}
          </Text>

          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button
              href={profileLink}
              style={{
                backgroundColor: '#B5620E',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: 16,
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {isHindi ? 'प्रोफ़ाइल संपादित करें / Edit Profile' : 'Edit Profile'}
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />

          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'प्रश्नों के लिए सहायता केंद्र से संपर्क करें।'
              : 'Contact support if you have questions about this decision.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
