"use client";

function FrameLayers({ style }) {
  const common = "absolute rounded-full pointer-events-none";

  switch (style) {
    case "cyber":
      return (
        <>
          <div className={`${common} -inset-2 border border-cyan-300/45 border-dashed animate-[spin_9s_linear_infinite]`} />
          <div className={`${common} -inset-1 border-[3px] border-transparent border-t-cyan-300 border-r-sky-500 border-b-blue-600 animate-[spin_3s_linear_infinite]`} />
          <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_9px_3px_rgba(34,211,238,.85)]" />
        </>
      );
    case "flame":
      return (
        <>
          <div className={`${common} -inset-2 bg-[conic-gradient(from_10deg,transparent_0_8%,#f97316_10%_17%,transparent_20%_36%,#ef4444_39%_48%,transparent_51%_67%,#fbbf24_70%_78%,transparent_81%)] blur-[2px] animate-[spin_5s_linear_infinite]`} />
          <div className={`${common} -inset-1 border-[3px] border-orange-400/90 shadow-[0_0_14px_3px_rgba(249,115,22,.65)] animate-pulse`} />
        </>
      );
    case "crystal":
      return (
        <>
          <div className="absolute -inset-1.5 rotate-45 rounded-[28%] border-2 border-emerald-200/90 shadow-[0_0_12px_rgba(52,211,153,.75)]" />
          <div className={`${common} -inset-1 border-2 border-emerald-500/90 border-dashed animate-[spin_8s_linear_infinite]`} />
          <div className={`${common} inset-0 border border-emerald-100/70`} />
        </>
      );
    case "galaxy":
      return (
        <>
          <div className={`${common} -inset-2 border-2 border-dashed border-fuchsia-400/85 animate-[spin_8s_linear_infinite]`} />
          <div className={`${common} -inset-1 border-[3px] border-transparent border-t-violet-400 border-b-fuchsia-400 animate-[spin_4s_linear_infinite_reverse]`} />
          <span className="absolute top-0 right-[15%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_3px_rgba(255,255,255,.8)] animate-pulse" />
          <span className="absolute bottom-[10%] left-0 h-1 w-1 rounded-full bg-fuchsia-200 shadow-[0_0_7px_2px_rgba(232,121,249,.9)]" />
        </>
      );
    case "crown":
      return (
        <>
          <div className="absolute -inset-2.5 rounded-full animate-spin [animation-duration:2s]">
            <div className="h-full w-full rounded-full border-4 border-transparent border-t-yellow-300 border-b-amber-500 drop-shadow-[0_0_7px_rgba(251,191,36,.9)]" />
          </div>
          <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
            <div className="h-full w-full rounded-full border-4 border-transparent border-l-yellow-500 border-r-yellow-300/80 drop-shadow-[0_0_7px_rgba(245,158,11,.85)]" />
          </div>
          <div className="absolute -inset-1 rounded-full bg-yellow-400/55 blur-md pointer-events-none" />
          <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-[0.85em] leading-none drop-shadow-[0_0_4px_rgba(251,191,36,1)]">♛</span>
        </>
      );
    case "rainbow":
      return (
        <>
          <div className={`${common} -inset-2 bg-[conic-gradient(#f43f5e,#f97316,#facc15,#22c55e,#38bdf8,#a855f7,#f43f5e)] p-[3px] animate-[spin_3s_linear_infinite]`}>
            <div className="h-full w-full rounded-full bg-slate-900" />
          </div>
          <div className={`${common} -inset-1 border border-white/80 animate-pulse`} />
        </>
      );
    case "eclipse":
      return (
        <>
          <div className={`${common} -inset-3 bg-[conic-gradient(from_0deg,transparent_0_12%,#38bdf8_18%,#a855f7_28%,transparent_38%_58%,#f8fafc_65%,#ec4899_73%,transparent_82%)] opacity-80 blur-[3px] animate-[spin_4s_linear_infinite]`} />
          <div className={`${common} -inset-2 border-2 border-violet-300/80 border-dashed animate-[spin_6s_linear_infinite_reverse]`} />
          <div className={`${common} -inset-1 border-[3px] border-transparent border-t-cyan-200 border-r-violet-400 border-b-fuchsia-400 animate-[spin_1.8s_linear_infinite]`} />
          <div className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_4px_rgba(255,255,255,.9)] animate-pulse" />
          <div className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_3px_rgba(34,211,238,.9)]" />
        </>
      );    case "glitch":
      return (
        <>
          <div className={`${common} -inset-1.5 border-2 border-cyan-300/90 animate-[pulse_.55s_steps(2)_infinite]`} style={{ transform: "translateX(2px)" }} />
          <div className={`${common} -inset-1.5 border-2 border-fuchsia-400/85 animate-[pulse_.55s_steps(2)_infinite]`} style={{ transform: "translateX(-2px)", animationDirection: "reverse" }} />
          <div className={`${common} -inset-1 border-2 border-violet-300/90 border-dashed animate-[spin_2s_linear_infinite]`} />
        </>
      );
    default:
      return null;
  }
}

export default function AvatarFrame({ frameStyle, size = 80, children, className = "" }) {
  const hasFrame = Boolean(frameStyle && frameStyle !== "default");

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full isolate ${className}`}
      style={{ width: size, height: size }}
    >
      {hasFrame && <FrameLayers style={frameStyle} />}
      <div className={`relative z-10 h-full w-full rounded-full overflow-hidden ${hasFrame ? "border-2 border-slate-950/80" : ""}`}>
        {children}
      </div>
    </div>
  );
}