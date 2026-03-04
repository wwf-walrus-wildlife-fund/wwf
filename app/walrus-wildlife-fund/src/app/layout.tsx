import type { Metadata } from "next";
import { ClientProviders } from "./client-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Walrus Wildlife Fund",
  description: "A Sui dApp for wildlife conservation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
