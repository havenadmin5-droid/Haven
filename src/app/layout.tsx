import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

export const metadata: Metadata = {
  title: "Haven - LGBTQIA+ Community Platform",
  description: "A privacy-first community platform for LGBTQIA+ individuals in India. Connect with queer professionals, allies, and support networks.",
  keywords: ["LGBTQIA+", "queer", "community", "India", "professional", "networking"],
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    title: "Haven - LGBTQIA+ Community Platform",
    description: "A privacy-first community platform for LGBTQIA+ individuals in India.",
    type: "website",
    locale: "en_IN",
    siteName: "Haven",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haven - LGBTQIA+ Community Platform",
    description: "A privacy-first community platform for LGBTQIA+ individuals in India.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFBF7" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1625" },
  ],
};

// Inline script to prevent flash of wrong theme
// Runs synchronously before any content renders
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('haven-theme');
    var theme = stored ? JSON.parse(stored).state.theme : 'light';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    // Enable transitions after a brief delay (after first paint)
    setTimeout(function() {
      document.body.classList.add('theme-ready');
    }, 100);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {/* Skip link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
