import * as React from 'react';
import { Html, Head, Body, Container, Text, Heading, Hr, Button, Section } from '@react-email/components';

interface MatchItem {
  name: string;
  age: number;
  city: string;
  education: string;
  matchScore: number;
}

interface WeeklyDigestEmailProps {
  userName: string;
  matches: MatchItem[];
  viewMatchesLink: string;
  lang?: 'en' | 'hi';
}

export function WeeklyDigestEmail({
  userName,
  matches,
  viewMatchesLink,
  lang = 'en',
}: WeeklyDigestEmailProps) {
  const isHindi = lang === 'hi';
  return (
    <Html lang={lang}>
      <Head />
      <Body style={{ background: '#FDFAF5', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E8E0D0' }}>
          <Heading style={{ color: '#B5620E', fontSize: 22, margin: '0 0 16px' }}>
            {isHindi ? 'गहोई सारथी — साप्ताहिक मैच डाइजेस्ट' : 'Gahoi Sarthi — Weekly Match Digest'}
          </Heading>
          
          <Text style={{ color: '#3D2E1A', fontSize: 16, lineHeight: '24px' }}>
            {isHindi
              ? `नमस्ते ${userName}, यहाँ आपके लिए इस सप्ताह के शीर्ष संभावित मिलान (Top Matches) दिए गए हैं:`
              : `Hello ${userName}, here are your top recommended matches for this week:`}
          </Text>

          <Section style={{ margin: '20px 0' }}>
            {matches.map((match, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  backgroundColor: '#FFF9F0',
                  borderRadius: '6px',
                  border: '1px solid #E8E0D0',
                  marginBottom: '12px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold', fontSize: '15px', color: '#B5620E' }}>
                        {match.name}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#2E7D32' }}>
                        {isHindi ? `मैच स्कोर: ${match.matchScore}%` : `Match: ${match.matchScore}%`}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ fontSize: '13px', color: '#6D5D4E', paddingTop: '4px' }}>
                        {match.age} {isHindi ? 'वर्ष' : 'years'} • {match.city} • {match.education}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </Section>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button
              href={viewMatchesLink}
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
              {isHindi ? 'सभी मिलान देखें / View All Matches' : 'View All Matches'}
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E8E0D0', margin: '24px 0' }} />
          
          <Text style={{ color: '#8A7A60', fontSize: 12, lineHeight: '18px' }}>
            {isHindi
              ? 'यह मेल आपको गहोई सारथी पर आपकी प्राथमिकताओं के आधार पर भेजा गया है।'
              : 'This digest was sent based on your preferences in Gahoi Sarthi.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
