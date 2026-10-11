import React from "react";
import dynamic from "next/dynamic";

import HeroSection from "./components/layout/HeroSection.jsx";
import FeaturesSection from "./components/layout/FeaturesSection.jsx";
import RulesSection from "./components/layout/RulesSection.jsx";

const ReviewsRating = dynamic(() => import("./components/ReviewsRating.jsx"));

import ParticlesBackground from "./components/layout/ParticlesBackground.jsx";

export default function Home() {
  return (
    <div
      dir="rtl"
      className="min-h-svh bg-[#060912] text-slate-200 overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-white"
    >
      {/* ═══════════════ Ambient Background ═══════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft particles (reduced for performance) */}
        <ParticlesBackground
          particleColors={["#6366f1", "#8b5cf6", "#06b6d4"]}
          particleCount={90}
          particleSpread={8}
          speed={0.05}
          particleBaseSize={60}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={false}
        />

        {/* Top-right indigo orb */}
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          }}
        />

        {/* Bottom-left violet orb */}
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          }}
        />

        {/* Center amber hint (ties with reviews gold) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(ellipse, #f59e0b 0%, transparent 70%)",
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Top vignette */}
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#060912] to-transparent" />

        {/* Bottom vignette */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#060912] to-transparent" />
      </div>

      {/* ═══════════════ Page Content ═══════════════ */}
      <div className="relative z-10">
        {/* Hero */}
        <HeroSection />

        {/* Divider */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-px bg-linear-to-l from-transparent via-indigo-500/30 to-transparent" />
        </div>

        {/* Features */}
        <section className="relative py-20 sm:py-28">
          <FeaturesSection />
        </section>

        {/* Divider */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-px bg-linear-to-l from-transparent via-violet-500/25 to-transparent" />
        </div>

        {/* Rules */}
        <section className="relative py-20 sm:py-28">
          <RulesSection />
        </section>

        {/* Divider before reviews */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-px bg-linear-to-l from-transparent via-amber-500/30 to-transparent" />
        </div>

        {/* Reviews — premium section */}
        <section className="relative py-20 sm:py-28 px-4">
          {/* Section ambient glow */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full" />

          <ReviewsRating />
        </section>

        {/* Footer spacer */}
        <div className="h-16" />
      </div>
    </div>
  );
}

