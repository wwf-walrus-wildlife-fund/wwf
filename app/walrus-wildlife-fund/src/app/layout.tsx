import type { Metadata } from "next";
import { ClientProviders } from "./client-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuskBazaar — Data Marketplace on Sui",
  description:
    "Upload, monetize, and buy data. Built for humans, AI agents, and LLMs. Seamless on-chain transactions with zero friction.",
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
