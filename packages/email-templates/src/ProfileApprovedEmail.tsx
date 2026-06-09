import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Button, Section } from '@react-email/components';

interface ProfileApprovedEmailProps {
  userName: string;
  profileLink: string;
  lang?: 'en' | 'hi';
}

export function ProfileApprovedEmail({
  userName,
  profileLink,
  lang = 'en',
}: ProfileApprovedEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
          <Heading style={{ color: '#B5620E', fontSize: 22, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — प्रोफ़ाइल स्वीकृत!' : 'Gahoi Sarthi — Profile Approved!'}
          </Heading>
          
          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते ${userName}, बधाई हो! आपकी प्रोफ़ाइल को व्यवस्थापक द्वारा अनुमोदित कर दिया गया है।`
              : `Hello ${userName}, congratulations! Your profile has been reviewed and approved by the admin.`}
          </Text>

          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px', margin: '16px 0' }}>
            {isHindi
              ? 'आपकी प्रोफ़ाइल अब लाइव है और अन्य गहोई समुदाय के सदस्य उसे खोज सकते हैं।'
              : 'Your profile is now live and discoverable by other members of the Gahoi community.'}
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
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
              {isHindi ? 'अपना खाता देखें / View Account' : 'View Account'}
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />
          
          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'यदि आपके कोई प्रश्न हैं या आप प्रोफ़ाइल को अपडेट करना चाहते हैं, तो कृपया सहायता केंद्र से संपर्क करें।'
              : 'If you have any questions or would like to make updates, please contact our support team.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
