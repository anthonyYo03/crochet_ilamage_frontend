import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import 'bootstrap/dist/css/bootstrap.min.css';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ilamaj",
  description: "crafted slowly, with love in every knot 🧶 burlap • crochet • macramé • handmade bags & decor for cozy souls ✨• delivery all over Lebanon",
  metadataBase: new URL("https://ilamajhandmade.com"),
  authors: [{ name: "Lama Al Jurdy" }], 
  creator: "Lama Al Jurdy",
  publisher: "Ilamaj",
  openGraph: {
    title: "Ilamaj",
    description:
      "Crafted slowly, with love in every knot 🧶 burlap • crochet • macramé • handmade bags & decor for cozy souls ✨ • delivery all over Lebanon",
    url: "https://ilamajhandmade.com/",
    siteName: "Ilamaj",
    locale: "en_US",
    type: "website",
    images: ["/ilamajPic.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ilamaj",
    url: "https://ilamajhandmade.com",
    founder: {
      "@type": "Person",
      name: "Lama Al Jurdy",
    },
    sameAs: [
      "https://www.instagram.com/_ilamaj?igsh=MTl3N3BzMnFheGdtMw%3D%3D",
      "https://www.facebook.com/share/1NJ9Yq5w3d/",
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster position="top-right"/>
      </body>
    </html>
  );
}