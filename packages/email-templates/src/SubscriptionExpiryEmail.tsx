import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Button, Section } from '@react-email/components';

interface SubscriptionExpiryEmailProps {
  userName: string;
  daysLeft: number;
  renewLink: string;
  lang?: 'en' | 'hi';
}

export function SubscriptionExpiryEmail({
  userName,
  daysLeft,
  renewLink,
  lang = 'en',
}: SubscriptionExpiryEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
          <Heading style={{ color: '#B5620E', fontSize: 20, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — प्रीमियम समाप्त होने वाला है' : 'Gahoi Sarthi — Premium Expiring Soon'}
          </Heading>
          
          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते ${userName}, आपका प्रीमियम सब्सक्रिप्शन ${daysLeft} दिनों में समाप्त हो जाएगा।`
              : `Hello ${userName}, your premium subscription is expiring in ${daysLeft} days.`}
          </Text>

          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px', margin: '16px 0' }}>
            {isHindi
              ? 'गहोई समुदाय के संभावित जीवनसाथियों के साथ सीधे संपर्क और बातचीत जारी रखने के लिए कृपया अभी रिन्यू (Renew) करें।'
              : 'Please renew now to maintain uninterrupted access to direct contact details and premium matching tools.'}
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button
              href={renewLink}
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
              {isHindi ? 'प्लान रिन्यू करें / Renew Plan' : 'Renew Subscription'}
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />
          
          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'यदि आपका पहले से कोई रिन्यूअल प्रोसेस चल रहा है, तो इस ईमेल को अनदेखा करें।'
              : 'If you have already initiated a renewal, please ignore this email.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
