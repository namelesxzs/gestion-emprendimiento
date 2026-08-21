import type { Metadata } from "next";
import { Montserrat, Didact_Gothic } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const didactGothic = Didact_Gothic({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "UIE · Acompañamiento a Emprendedores",
  description: "Seguimiento de emprendedores por la cadena de valor de la UIE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${didactGothic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
