import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkLens • AI Website Inspector",
  description:
    "Inspect links before you open them. LinkLens previews page content, safety signals, and community trust in one place.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
