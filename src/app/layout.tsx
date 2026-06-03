import type { Metadata } from "next";
import "./globals.css";

import { getGlobalBranding } from "@/lib/branding";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getGlobalBranding();

  return {
    title: `${branding.name} | Multi-Tenant Learning Platform`,
    description: `The ultimate white-label learning management system for scaling your training business with ${branding.name}.`,
    keywords: ["LMS", "SaaS", "Multi-tenant", "Education", "Online Courses"],
    icons: {
      icon: branding.favicon,
    },
    authors: [{ name: `${branding.name} Team` }],
  };
}

import { Providers } from "@/components/Providers";
import ChatWidget from "@/components/chat/ChatWidget";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SEPPX2BQF7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SEPPX2BQF7');
          `}
        </Script>
        <Providers>
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
