import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "Soaring Eagles Admin",
  description: "Administrative Scheduling Terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${roboto.variable} font-sans antialiased bg-base text-text min-h-screen`}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
