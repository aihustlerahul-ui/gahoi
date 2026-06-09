import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Link, Button, Section } from '@react-email/components';

interface InterestAcceptedEmailProps {
  receiverName: string;
  senderName: string;
  contactLink: string;
  lang?: 'en' | 'hi';
}

export function InterestAcceptedEmail({
  receiverName,
  senderName,
  contactLink,
  lang = 'en',
}: InterestAcceptedEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
          <Heading style={{ color: '#B5620E', fontSize: 22, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — बधाई हो!' : 'Gahoi Sarthi — Congratulations! Match Found'}
          </Heading>
          
          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते ${senderName}, ${receiverName} ने आपका रुचि अनुरोध (Interest Request) स्वीकार कर लिया है!`
              : `Hello ${senderName}, ${receiverName} has accepted your interest request!`}
          </Text>

          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px', margin: '16px 0' }}>
            {isHindi
              ? 'अब आप उनके संपर्क विवरण देख सकते हैं और सीधे बातचीत शुरू कर सकते हैं।'
              : 'You can now view their contact details and start communicating directly.'}
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button
              href={contactLink}
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
              {isHindi ? 'विवरण देखें / View Details' : 'View Contact Details'}
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />
          
          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'याद रखें, संपर्क विवरण केवल उन उपयोगकर्ताओं के लिए सुलभ हैं जिनके पास भुगतान किया गया सदस्यता प्लान है।'
              : 'Remember, contact details are only visible to paid subscribers who have a mutual match.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
