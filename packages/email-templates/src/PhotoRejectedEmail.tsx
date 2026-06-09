import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Button, Section } from '@react-email/components';

interface PhotoRejectedEmailProps {
  userName: string;
  reason: string;
  uploadLink: string;
  lang?: 'en' | 'hi';
}

export function PhotoRejectedEmail({
  userName,
  reason,
  uploadLink,
  lang = 'en',
}: PhotoRejectedEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
          <Heading style={{ color: '#D32F2F', fontSize: 22, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — फोटो अस्वीकृत' : 'Gahoi Sarthi — Photo Rejected'}
          </Heading>
          
          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते ${userName}, आपकी हाल ही में अपलोड की गई फोटो हमारी समीक्षा दिशानिर्देशों के कारण अस्वीकृत कर दी गई है।`
              : `Hello ${userName}, your recently uploaded photo has been rejected during moderation as it did not meet our guidelines.`}
          </Text>

          <Section style={{ margin: '16px 0', padding: '12px 16px', backgroundColor: '#FFEBEE', borderRadius: '6px', borderLeft: '4px solid #D32F2F' }}>
            <Text style={{ color: '#C62828', fontSize: 14, margin: '0' }}>
              <strong>{isHindi ? 'अस्वीकृति का कारण / Reason:' : 'Reason for rejection:'}</strong> {reason}
            </Text>
          </Section>

          <Text style={{ color: '#3D2E1A', fontSize: 15, lineHeight: '22px', margin: '16px 0' }}>
            {isHindi
              ? 'कृपया एक स्पष्ट, उपयुक्त फ़ोटो अपलोड करें जो हमारे नियमों का पालन करती हो ताकि आपकी प्रोफ़ाइल पूर्ण हो सके।'
              : 'Please upload a clear, appropriate photo that follows our guidelines to complete your profile.'}
          </Text>

          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button
              href={uploadLink}
              style={{
                backgroundColor: '#D32F2F',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: 16,
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {isHindi ? 'फोटो फिर से अपलोड करें / Re-upload Photo' : 'Re-upload Photo'}
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />
          
          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'कृपया सुनिश्चित करें कि चेहरे पर कोई फ़िल्टर, चश्मा या अन्य बाधा न हो।'
              : 'Please ensure there are no filters, sunglasses, or other face obstructions.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
