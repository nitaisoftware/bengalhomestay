import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title:       'BengalHomestay — West Bengal Homestay Directory',
  description: 'Discover the best homestays across West Bengal. Search by district, category, and amenities.',
  keywords:    'bengal homestay, west bengal tourism, darjeeling homestay, sundarbans stay',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased" suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
