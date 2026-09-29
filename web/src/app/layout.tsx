import type { Metadata } from "next";
import { Montserrat, Didact_Gothic } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${didactGothic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider session={session}>
          <NavBar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
