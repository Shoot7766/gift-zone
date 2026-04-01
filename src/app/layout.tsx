import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/lib/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B4332",
};

export const metadata: Metadata = {
  title: "Gift Zone",
  description:
    "O'zbekistondagi sovg'alar platformasi — minglab sovg'alar, tez yetkazib berish.",
  metadataBase: getSiteUrl(),
  icons: {
    icon: "/api/site-logo?v=3",
    apple: "/api/site-logo?v=3",
    shortcut: "/api/site-logo?v=3",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  localStorage.setItem('theme', 'dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
