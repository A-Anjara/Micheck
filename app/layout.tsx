import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import TanstackProvider from "@/providers/TanstackProvider";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Mi-check",
  description: "Le détecteur de fausses informations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body
        className={`${montserrat.className} min-h-screen bg-[#140d0b] text-white antialiased`}
      >
        <TanstackProvider>{children}</TanstackProvider>
      </body>
    </html>
  );
}
