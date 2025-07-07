import type {Metadata} from 'next';
import { Orbitron, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

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
    <html lang="de" suppressHydrationWarning>
      <head />
      <body className={`antialiased ${orbitron.variable} ${robotoMono.variable} font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
