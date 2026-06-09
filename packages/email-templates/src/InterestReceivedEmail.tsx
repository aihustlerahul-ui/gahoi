import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Link, Button, Section } from '@react-email/components';

interface InterestReceivedEmailProps {
  senderName: string;
  senderAge: number;
  senderCity: string;
  senderEducation: string;
  senderOccupation: string;
  profileLink: string;
  lang?: 'en' | 'hi';
}

export function InterestReceivedEmail({
  senderName,
  senderAge,
  senderCity,
  senderEducation,
  senderOccupation,
  profileLink,
  lang = 'en',
}: InterestReceivedEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
          <Heading style={{ color: '#B5620E', fontSize: 22, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — नया अनुरोध' : 'Gahoi Sarthi — New Interest Received'}
          </Heading>
          
          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते, आपको ${senderName} से एक नया रुचि अनुरोध (Interest Request) प्राप्त हुआ है।`
              : `Hello, you have received a new interest request from ${senderName}.`}
          </Text>

          <Section style={{ margin: '24px 0', padding: '16px', backgroundColor: '#FFF9F0', borderRadius: '6px', borderLeft: '4px solid #B5620E' }}>
            <Text style={{ color: '#3D2E1A', fontSize: 15, margin: '0 0 8px' }}>
              <strong>{isHindi ? 'नाम / Name:' : 'Name:'}</strong> {senderName}
            </Text>
            <Text style={{ color: '#3D2E1A', fontSize: 15, margin: '0 0 8px' }}>
              <strong>{isHindi ? 'उम्र / Age:' : 'Age:'}</strong> {senderAge} {isHindi ? 'वर्ष' : 'years'}
            </Text>
            <Text style={{ color: '#3D2E1A', fontSize: 15, margin: '0 0 8px' }}>
              <strong>{isHindi ? 'शहर / City:' : 'City:'}</strong> {senderCity}
            </Text>
            <Text style={{ color: '#3D2E1A', fontSize: 15, margin: '0 0 8px' }}>
              <strong>{isHindi ? 'शिक्षा / Education:' : 'Education:'}</strong> {senderEducation}
            </Text>
            <Text style={{ color: '#3D2E1A', fontSize: 15, margin: '0' }}>
              <strong>{isHindi ? 'व्यवसाय / Occupation:' : 'Occupation:'}</strong> {senderOccupation}
            </Text>
          </Section>

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
              {isHindi ? 'प्रोफ़ाइल देखें / View Profile' : 'View Profile'}
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />
          
          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'यदि आप रुचि रखते हैं, तो उन्हें प्रतिक्रिया देने के लिए ऐप पर लॉगिन करें।'
              : 'If you are interested, log in to the app to respond to their request.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
