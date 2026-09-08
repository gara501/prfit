import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { PwaClientSetup } from "@/components/pwa/PwaClientSetup";
import "./globals.css";

const themeScript = `(()=>{try{const key="prtracker-theme";const stored=localStorage.getItem(key);const isDark=stored==="dark"||(stored===null&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",isDark);document.documentElement.style.colorScheme=isDark?"dark":"light"}catch{}})()`;

const nunito = localFont({
  src: [
    {
      path: "../../public/fonts/nunito/variable/nunito-latin-wght-normal.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/nunito/variable/nunito-latin-wght-italic.woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  variable: "--font-nunito",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PRFit",
    template: "%s | PRFit",
  },
  applicationName: "PRFit",
  description: "Gestión de rutinas, clientes y sesiones de entrenamiento.",
  icons: {
    icon: [
      { type: "image/png", url: "/pwa-icon?size=192" },
      { type: "image/png", url: "/pwa-icon?size=512" },
    ],
    shortcut: "/logo.svg",
    apple: [{ sizes: "180x180", type: "image/png", url: "/pwa-icon?size=180" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PRFit" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <PwaClientSetup />
        {children}
      </body>
    </html>
  );
}
