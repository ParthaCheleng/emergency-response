import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: 'Emergency Response Commander AI | Mission Control',
  description:
    'Tactical AI-powered emergency operations center dashboard. Real-time crisis management with 8 specialized AI agents for coordinated disaster response.',
  keywords: [
    'emergency response',
    'AI operations center',
    'crisis management',
    'disaster response',
    'tactical dashboard',
  ],
  authors: [{ name: 'Emergency Response Commander AI' }],
  openGraph: {
    title: 'Emergency Response Commander AI',
    description: 'AI-Powered Tactical Emergency Operations Center',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#050810" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="font-sans antialiased bg-[#050810] text-slate-100 min-h-screen">
        {/* Tactical grid background overlay */}
        <div className="fixed inset-0 tactical-grid-bg pointer-events-none z-0" />

        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
