import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { ThemeProvider, NO_FLASH_THEME_SCRIPT } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "NeuroBrain- AI-Powered NeuroBrain Analysis",
  description:
    "Upload your MRI image and receive an AI-assisted classification within seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Runs before hydration so the dark class is set before first paint. */}
        <Script id="theme-no-flash" strategy="beforeInteractive">
          {NO_FLASH_THEME_SCRIPT}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
