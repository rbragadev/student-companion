import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Companion Admin',
  description: 'Painel administrativo do Student Companion',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
