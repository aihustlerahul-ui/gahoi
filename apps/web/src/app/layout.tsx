import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gahoi Sarthi | गहोई सारथी',
  description: 'Matrimony for the Gahoi Bania community',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
