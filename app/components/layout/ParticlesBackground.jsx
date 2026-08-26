"use client";

import dynamic from "next/dynamic";

const Particles = dynamic(
  () => import("../Particles.jsx"),
  {
    ssr: false,
  }
);

export default function ParticlesBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Particles
        particleColors={["#6366f1", "#8b5cf6", "#06b6d4"]}
        particleCount={180}
        particleSpread={6}
        speed={0.08}
        particleBaseSize={80}
        moveParticlesOnHover={true}
        alphaParticles={true}
        disableRotation={false}
      />
    </div>
  );
}