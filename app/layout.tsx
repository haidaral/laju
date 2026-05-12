import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
  const hasClerkEnv = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
  return (
    <html lang="en">
      <body>{hasClerkEnv ? <ClerkProvider>{children}</ClerkProvider> : children}</body>
    </html>
  );
}
