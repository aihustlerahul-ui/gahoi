import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr } from '@react-email/components';

interface ReportOutcomeEmailProps {
  lang?: 'en' | 'hi';
}

/**
 * Generic report resolution notice — no PII about the reported user or action taken.
 */
export function ReportOutcomeEmail({ lang = 'en' }: ReportOutcomeEmailProps) {
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
          <Heading style={{ color: '#B5620E', fontSize: 22, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — रिपोर्ट समीक्षा पूर्ण' : 'Gahoi Sarthi — Report Reviewed'}
          </Heading>

          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? 'आपकी रिपोर्ट की समीक्षा हमारी टीम ने पूरी कर ली है।'
              : 'Your report has been reviewed by our moderation team.'}
          </Text>

          <Text style={{ color: '#3D2E1A', fontSize: 15, lineHeight: '22px', margin: '16px 0' }}>
            {isHindi
              ? 'हम समुदाय की सुरक्षा के लिए उचित कार्रवाई करते हैं। विवरण साझा नहीं किए जाते।'
              : 'We take appropriate action to keep the community safe. Outcome details are not shared.'}
          </Text>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />

          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi ? 'धन्यवाद — गहोई सारथी' : 'Thank you — Gahoi Sarthi'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
