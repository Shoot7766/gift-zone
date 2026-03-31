import type { Metadata, Viewport } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/Toast";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B4332",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: { default: "Gift Zone — Premium sovg'alar platformasi", template: "%s | Gift Zone" },
    description: "O'zbekistondagi premium sovg'alar platformasi — minglab sovg'alar, tez va xavfsiz yetkazib berish.",
    keywords: ["sovg'a", "gift zone", "uzbekistan", "gul buketi", "flowers", "platforma", "dostavka"],
    openGraph: {
      title: "Gift Zone — Premium sovg'alar platformasi",
      description: "O'zbekiston bo'ylab sovg'a buyurtma qiling",
      type: "website",
      locale: locale === 'ru' ? 'ru_RU' : locale === 'en' ? 'en_US' : 'uz_UZ',
    },
  };
}

export default async function RootLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <ToastProvider>
          <Navbar />
          <main style={{ minHeight: "calc(100vh - 160px)", paddingTop: "80px" }}>
            {children}
          </main>
          <Footer />
          <BottomNav />
        </ToastProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
