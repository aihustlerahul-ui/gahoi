import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Section } from '@react-email/components';

interface SubscriptionEmailProps {
  userName: string;
  planName: string;
  amount: number;
  expiryDate: string;
  lang?: 'en' | 'hi';
}

export function SubscriptionEmail({
  userName,
  planName,
  amount,
  expiryDate,
  lang = 'en',
}: SubscriptionEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
          <Heading style={{ color: '#B5620E', fontSize: 22, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — सदस्यता सक्रिय!' : 'Gahoi Sarthi — Subscription Activated!'}
          </Heading>
          
          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते ${userName}, गहोई सारथी प्रीमियम की सदस्यता लेने के लिए धन्यवाद।`
              : `Hello ${userName}, thank you for subscribing to Gahoi Sarthi Premium.`}
          </Text>

          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px', margin: '12px 0' }}>
            {isHindi
              ? 'आपका भुगतान सफलतापूर्वक प्राप्त हो गया है और आपकी प्रीमियम सुविधाएं सक्रिय कर दी गई हैं।'
              : 'Your payment was received successfully and your premium features are now active.'}
          </Text>

          <Section style={{ margin: '24px 0', padding: '16px', backgroundColor: '#FFF9F0', borderRadius: '6px', border: '1px solid #E8B84B' }}>
            <Text style={{ color: '#3D2E1A', fontSize: 15, margin: '0 0 8px' }}>
              <strong>{isHindi ? 'प्लान का नाम / Plan Name:' : 'Plan:'}</strong> {planName}
            </Text>
            <Text style={{ color: '#3D2E1A', fontSize: 15, margin: '0 0 8px' }}>
              <strong>{isHindi ? 'राशि / Amount:' : 'Amount Paid:'}</strong> ₹{amount}
            </Text>
            <Text style={{ color: '#3D2E1A', fontSize: 15, margin: '0' }}>
              <strong>{isHindi ? 'समाप्ति तिथि / Expiry Date:' : 'Expires On:'}</strong> {expiryDate}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />
          
          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'अब आप असीमित रुचि अनुरोध भेज सकते हैं और स्वीकृत मेल खाते उपयोगकर्ताओं के सीधे संपर्क देख सकते हैं।'
              : 'You can now send unlimited interest requests and view direct contacts of accepted mutual matches.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
