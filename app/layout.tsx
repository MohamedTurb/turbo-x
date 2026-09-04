import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TurboX — Learn. Practice. Perform.",
  description:
    "A modern learning and assessment platform for students and instructors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
