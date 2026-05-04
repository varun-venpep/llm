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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
