import dynamic from "next/dynamic";
const AppFooter = dynamic(() => import("./components/layout/AppFooter"));
import PageLoaderWrapper from "./components/PageLoaderWrapper";
import NavBar from "./components/layout/NavBar";
import { StudentAuthProvider } from "./context/StudentAuthContext";
import { GroupContextProvider } from "./context/GroupContextProvider";
import { LatestLectureProvider } from "./context/LatestLectureContext";
import { InternetStatusProvider } from "./context/InternetStatusContext";
import OfflineHandler from "./components/OfflineHandler";
import MaintenanceGuard from "./components/MaintenanceGuard";
import VersionWatcher from "./components/VersionWatcher";
import RankingsWatcher from "./components/RankingsWatcher";
import SecurityGuard from "./components/SecurityGuard";
import "./globals.css";

export const metadata = {
  title: "CodaX - منصة تعليم البرمجة الاحترافية",
  description:
    "منصة تعليم البرمجة وتطوير الويب الشاملة - Frontend, Backend, FullStack",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }, { url: "/favicon.ico" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

const loaderCSS = `
  #codax-loader {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    background: #f8fafc;
    opacity: 1;
    visibility: visible;
    pointer-events: all;
    transition: opacity 0.45s ease, visibility 0.45s ease;
  }
  /* ─── Hide class — added by JS, never removes the node so React stays happy ─── */
  #codax-loader.codax-loaded {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
  @media (prefers-color-scheme: dark) {
    #codax-loader { background: #070b14; }
  }

  #codax-loader .cl-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(to right, #6366f1, #a855f7, #ec4899);
    animation: cl-bar-grow 2.5s ease-in-out forwards;
    transform-origin: left;
    transform: scaleX(0);
  }
  @keyframes cl-bar-grow {
    0%   { transform: scaleX(0); }
    60%  { transform: scaleX(0.75); }
    100% { transform: scaleX(0.9); }
  }

  #codax-loader .cl-spinner {
    width: 76px; height: 76px;
    position: relative;
  }
  #codax-loader .cl-ring {
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 3.5px solid transparent;
    border-top-color: #6366f1;
    border-right-color: #a855f7;
    animation: cl-spin 1s linear infinite;
  }
  #codax-loader .cl-ring2 {
    position: absolute; inset: 10px;
    border-radius: 50%;
    border: 3px solid transparent;
    border-bottom-color: #ec4899;
    border-left-color: #8b5cf6;
    animation: cl-spin 0.7s linear infinite reverse;
  }
  #codax-loader .cl-center {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
  }
  #codax-loader .cl-center-dot {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    box-shadow: 0 0 12px #6366f180;
    animation: cl-pulse 1.4s ease-in-out infinite;
  }
  #codax-loader .cl-title {
    font-family: Arial, sans-serif;
    font-size: 24px; font-weight: 900;
    background: linear-gradient(to right, #6366f1, #a855f7, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 3px;
  }
  #codax-loader .cl-sub {
    font-family: Arial, sans-serif;
    font-size: 13px; color: #94a3b8;
    margin-top: -10px;
  }
  #codax-loader .cl-dots { display: flex; gap: 8px; }
  #codax-loader .cl-d {
    width: 8px; height: 8px;
    border-radius: 50%; background: #6366f1;
    animation: cl-bounce 0.9s ease-in-out infinite;
    opacity: 0.4; transform: scale(0.6);
  }
  #codax-loader .cl-d:nth-child(2) { animation-delay: 0.18s; background: #a855f7; }
  #codax-loader .cl-d:nth-child(3) { animation-delay: 0.36s; background: #ec4899; }

  @keyframes cl-spin   { to { transform: rotate(360deg); } }
  @keyframes cl-pulse  {
    0%, 100% { transform: scale(0.8); opacity: 0.5; }
    50%      { transform: scale(1.2); opacity: 1; }
  }
  @keyframes cl-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%           { transform: scale(1.1); opacity: 1; }
  }
`;

/*
  ⚠️ CRITICAL: We only ADD a CSS class — we NEVER call el.remove() or el.parentNode.removeChild(el).
  Removing the node before React hydration causes "insertBefore / removeChild" errors because
  React's vDOM still expects the node to exist in the real DOM during reconciliation.
  Hiding with a CSS class keeps the node in the DOM, React stays happy, and the user sees nothing.
*/
const loaderScript = `
  (function () {
    function hideLoader() {
      var el = document.getElementById('codax-loader');
      if (el) {
        el.classList.add('codax-loaded');
      }
    }
    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader, { once: true });
    }
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>CodaX</title>
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        {/* Google Fonts — Noto Sans Arabic + Cairo */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: loaderCSS }} />
      </head>

      <body
        className="min-h-screen flex flex-col antialiased"
        suppressHydrationWarning
      >
        {/*
          ── INITIAL PAGE LOADER ──────────────────────────────────────
          Rendered in SSR HTML → appears before any JS loads.
          Hidden via CSS class when window.load fires.
          NEVER removed from DOM — React needs it during hydration.
        ──────────────────────────────────────────────────────────── */}
        <div id="codax-loader" suppressHydrationWarning>
          <div className="cl-bar" />
          <div className="cl-spinner">
            <div className="cl-ring" />
            <div className="cl-ring2" />
            <div className="cl-center">
              <div className="cl-center-dot" />
            </div>
          </div>
          <div className="cl-title">CodaX</div>
          <div className="cl-sub">جارٍ التحميل…</div>
          <div className="cl-dots">
            <div className="cl-d" />
            <div className="cl-d" />
            <div className="cl-d" />
          </div>
        </div>

        {/* Adds .codax-loaded class on window.load — does NOT remove the node */}
        <script dangerouslySetInnerHTML={{ __html: loaderScript }} />

        {/* Navigation-transition loader (React, skips first render) */}
        <PageLoaderWrapper />

        <main id="main" className="flex-1 flex flex-col bg-linear-to-r">
          <InternetStatusProvider>
            <OfflineHandler>
              <SecurityGuard />
              <VersionWatcher />
              <RankingsWatcher />
              <MaintenanceGuard>
                <StudentAuthProvider>
                  <GroupContextProvider>
                    <LatestLectureProvider>
                      <NavBar />
                      <div className="flex-1">{children}</div>
                      <AppFooter />
                    </LatestLectureProvider>
                  </GroupContextProvider>
                </StudentAuthProvider>
              </MaintenanceGuard>
            </OfflineHandler>
          </InternetStatusProvider>
        </main>
      </body>
    </html>
  );
}
