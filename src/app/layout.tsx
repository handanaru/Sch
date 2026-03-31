import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HyperEVM Staking Dashboard",
  description: "Track staking, unstaking, and claim history on HyperEVM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
