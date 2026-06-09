import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EuroSkills Concerts",
  description: "Book concert tickets for EuroSkills events in Graz",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
