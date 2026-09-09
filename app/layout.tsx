import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Study OS — Your AI Teacher, Coach & Study Partner",
  description:
    "Upload anything. Tell AI your exam goal. Learn, practice, analyze weaknesses, and plan your next revision.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
