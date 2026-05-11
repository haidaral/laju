import type { Metadata } from "next";
import "./globals.css";
import "./public-pages.css";

export const metadata: Metadata = {
  title: "Laju",
  description: "Dual-pipeline tracker for jobs and freelance leads."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
