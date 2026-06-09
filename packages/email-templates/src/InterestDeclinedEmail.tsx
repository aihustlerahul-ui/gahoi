import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Section } from '@react-email/components';

interface InterestDeclinedEmailProps {
  receiverName: string;
  senderName: string;
  lang?: 'en' | 'hi';
}

export function InterestDeclinedEmail({
  receiverName,
  senderName,
  lang = 'en',
}: InterestDeclinedEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
          <Heading style={{ color: '#555555', fontSize: 20, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — अनुरोध अपडेट' : 'Gahoi Sarthi — Request Update'}
          </Heading>
          
          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते ${senderName}, ${receiverName} ने आपकी रुचि के अनुरोध को अभी आगे न बढ़ाने का फैसला किया है।`
              : `Hello ${senderName}, ${receiverName} has chosen not to proceed with your interest request at this time.`}
          </Text>

          <Text style={{ color: '#3D2E1A', fontSize: 15, lineHeight: '22px', margin: '16px 0' }}>
            {isHindi
              ? 'चिंता न करें! गहोई सारथी पर कई अन्य योग्य प्रोफ़ाइल हैं जो आपकी प्राथमिकताओं से मेल खा सकती हैं।'
              : "Don't worry! There are many other active and compatible profiles on Gahoi Sarthi that match your preferences."}
          </Text>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />
          
          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'शुभकामनाएं, गहोई सारथी टीम।'
              : 'Best wishes, Team Gahoi Sarthi.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
