import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "SIAP-KES - Sistem Integrasi Aset & Pelayanan Kesehatan Daerah",
  description: "Sistem Integrasi Aset & Pelayanan Kesehatan Daerah untuk Manajemen Fasilitas Kesehatan dan Monitoring Terpadu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${roboto.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
