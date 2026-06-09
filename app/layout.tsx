import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const themePreferenceScript = `
(function () {
  try {
    var theme = localStorage.getItem("watch-tracker-theme") || "system";
    var languageCookie = document.cookie
      .split("; ")
      .find(function (cookie) {
        return cookie.indexOf("watch-tracker-language=") === 0;
      });
    var cookieLanguage = languageCookie ? languageCookie.split("=")[1] : null;
    var language =
      localStorage.getItem("watch-tracker-language") || cookieLanguage || "en";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);
    var root = document.documentElement;

    root.classList.toggle("dark", shouldUseDark);
    root.dataset.themePreference = theme;
    root.dataset.theme = shouldUseDark ? "dark" : "light";
    root.dataset.languagePreference = language;
    root.lang = language === "zh" ? "zh-CN" : "en";
  } catch (_error) {
    return;
  }
})();
`;

export const metadata: Metadata = {
  title: "Watch Tracker",
  description: "Search TMDB movies and TV shows, then track them in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-zinc-50 text-zinc-900"
      >
        <script dangerouslySetInnerHTML={{ __html: themePreferenceScript }} />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col px-6 py-10 sm:px-8">
            {children}
          </main>
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
