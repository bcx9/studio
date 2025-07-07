import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'MeshControl',
  description: 'Web-basierte Leitstelle für Mesh-Netzwerke',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <head />
      <body className={`antialiased font-sans ${inter.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
