"use client";

import { AngelicFrame, PhoenixFrame, PinkButterflyFrame, SingularityFrame, SovereignNebulaFrame} from "./fram";

function FrameLayers({ style }) {
  const common = "absolute rounded-full pointer-events-none";

  switch (style) {
    case "cyber":
      return (
        <>
          <div
            className={`${common} -inset-2 border border-cyan-300/45 border-dashed animate-[spin_9s_linear_infinite]`}
          />
          <div
            className={`${common} -inset-1 border-[3px] border-transparent border-t-cyan-300 border-r-sky-500 border-b-blue-600 animate-[spin_3s_linear_infinite]`}
          />
          <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_9px_3px_rgba(34,211,238,.85)]" />
        </>
      );
    case "flame":
      return (
        <>
          <div
            className={`${common} -inset-2 bg-[conic-gradient(from_10deg,transparent_0_8%,#f97316_10%_17%,transparent_20%_36%,#ef4444_39%_48%,transparent_51%_67%,#fbbf24_70%_78%,transparent_81%)] blur-[2px] animate-[spin_5s_linear_infinite]`}
          />
          <div
            className={`${common} -inset-1 border-[3px] border-orange-400/90 shadow-[0_0_14px_3px_rgba(249,115,22,.65)] animate-pulse`}
          />
        </>
      );
    case "crystal":
      return (
        <>
          <div className="absolute -inset-1.5 rotate-45 rounded-[28%] border-2 border-emerald-200/90 shadow-[0_0_12px_rgba(52,211,153,.75)]" />
          <div
            className={`${common} -inset-1 border-2 border-emerald-500/90 border-dashed animate-[spin_8s_linear_infinite]`}
          />
          <div className={`${common} inset-0 border border-emerald-100/70`} />
        </>
      );
    case "galaxy":
      return (
        <>
          <div
            className={`${common} -inset-2 border-2 border-dashed border-fuchsia-400/85 animate-[spin_8s_linear_infinite]`}
          />
          <div
            className={`${common} -inset-1 border-[3px] border-transparent border-t-violet-400 border-b-fuchsia-400 animate-[spin_4s_linear_infinite_reverse]`}
          />
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
          <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-[0.85em] leading-none drop-shadow-[0_0_4px_rgba(251,191,36,1)]">
            ♛
          </span>
        </>
      );

    case "rainbow":
      return (
        <>
          <div
            className={`${common} -inset-2 bg-[conic-gradient(#f43f5e,#f97316,#facc15,#22c55e,#38bdf8,#a855f7,#f43f5e)] p-[3px] animate-[spin_3s_linear_infinite]`}
          >
            <div className="h-full w-full rounded-full bg-slate-900" />
          </div>
          <div
            className={`${common} -inset-1 border border-white/80 animate-pulse`}
          />
        </>
      );
    case "eclipse":
      return (
        <>
          <div
            className={`${common} -inset-3 bg-[conic-gradient(from_0deg,transparent_0_12%,#38bdf8_18%,#a855f7_28%,transparent_38%_58%,#f8fafc_65%,#ec4899_73%,transparent_82%)] opacity-80 blur-[3px] animate-[spin_4s_linear_infinite]`}
          />
          <div
            className={`${common} -inset-2 border-2 border-violet-300/80 border-dashed animate-[spin_6s_linear_infinite_reverse]`}
          />
          <div
            className={`${common} -inset-1 border-[3px] border-transparent border-t-cyan-200 border-r-violet-400 border-b-fuchsia-400 animate-[spin_1.8s_linear_infinite]`}
          />
          <div className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_4px_rgba(255,255,255,.9)] animate-pulse" />
          <div className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_3px_rgba(34,211,238,.9)]" />
        </>
      );
    case "aurora":
      return (
        <>
          <div
            className={`${common} -inset-3 bg-[conic-gradient(from_90deg,transparent_0_10%,#34d399_16%,#22d3ee_28%,transparent_38%_55%,#a78bfa_62%,#34d399_74%,transparent_85%)] blur-xs opacity-90 animate-[spin_7s_linear_infinite] mix-blend-screen`}
          />
          <div
            className={`${common} -inset-1.5 bg-[conic-gradient(from_180deg,transparent_0_20%,#22d3ee_30%,transparent_45%_70%,#4ade80_80%,transparent_92%)] blur-[2px] opacity-80 animate-[spin_4.5s_linear_infinite_reverse] mix-blend-screen`}
          />
          <div
            className={`${common} inset-0 border border-emerald-100/60 shadow-[0_0_10px_rgba(167,243,208,.6)] animate-pulse`}
          />
          <span className="absolute top-0 left-[20%] h-1 w-1 rounded-full bg-white shadow-[0_0_6px_2px_rgba(255,255,255,.9)] animate-pulse" />
          <span className="absolute bottom-1 right-[15%] h-1 w-1 rounded-full bg-cyan-100 shadow-[0_0_6px_2px_rgba(207,250,254,.9)] animate-pulse" />
        </>
      );
    case "rift":
      return (
        <>
          <div
            className={`${common} -inset-2 bg-[radial-gradient(circle_at_center,#000_0%,#1e1b4b_35%,transparent_70%)] animate-[pulse_2.2s_ease-in-out_infinite]`}
          />
          <div
            className={`${common} -inset-2 border-2 border-transparent border-t-fuchsia-400 border-r-violet-500 border-b-cyan-300 border-l-indigo-400 animate-[spin_2.5s_linear_infinite]`}
          />
          <div
            className={`${common} -inset-1 border border-dashed border-white/40 animate-[spin_5s_linear_infinite_reverse]`}
          />
          <span className="absolute top-[10%] right-0 h-1 w-1 rounded-full bg-fuchsia-200 shadow-[0_0_8px_3px_rgba(240,171,252,.9)] animate-ping" />
          <span className="absolute bottom-0 left-[25%] h-1 w-1 rounded-full bg-cyan-200 shadow-[0_0_8px_3px_rgba(165,243,252,.9)] animate-ping" />
        </>
      );
    case "glitch":
      return (
        <>
          <div
            className={`${common} -inset-1.5 border-2 border-cyan-300/90 animate-[pulse_.55s_steps(2)_infinite]`}
            style={{ transform: "translateX(2px)" }}
          />
          <div
            className={`${common} -inset-1.5 border-2 border-fuchsia-400/85 animate-[pulse_.55s_steps(2)_infinite]`}
            style={{
              transform: "translateX(-2px)",
              animationDirection: "reverse",
            }}
          />
          <div
            className={`${common} -inset-1 border-2 border-violet-300/90 border-dashed animate-[spin_2s_linear_infinite]`}
          />
        </>
      );
          case "dragon":
      return (
        <>
          <div className={`${common} -inset-3 bg-[conic-gradient(from_0deg,#7f1d1d_0_15%,#f59e0b_20_35%,#dc2626_40_60%,#fbbf24_65_80%,#7f1d1d_85%)] opacity-70 blur-xs animate-[spin_5s_linear_infinite]`} />
          <div className={`${common} -inset-2 border-4 border-transparent border-t-red-600 border-r-amber-500 border-b-orange-500 border-l-red-700 animate-[spin_3s_linear_infinite]`} />
          <div className={`${common} -inset-1 border-2 border-red-400/80 border-dashed animate-[spin_7s_linear_infinite_reverse]`} />
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-lg drop-shadow-[0_0_6px_rgba(220,38,38,0.9)]">🐉</span>
        </>
      );

case "angelic":
  return <AngelicFrame />


case "singularity":
  return <SingularityFrame/>


case "Phoenix":
  return <PhoenixFrame/>

case "butterfly":
  return <PinkButterflyFrame/>

case "sovereign-nebula":
  return <SovereignNebulaFrame/>






      // إطار الشفق القطبي: هولوجرافي ولامع بألوان نادرة.
    case "aurora":
      return (
        <>
          <div className={`${common} -inset-3 bg-[conic-gradient(from_180deg,#22d3ee,#34d399,#a3e635,#22d3ee,#8b5cf6,#22d3ee)] opacity-75 blur-[6px] animate-[spin_7s_linear_infinite]`} />
          <div className={`${common} -inset-2 border-[3px] border-transparent border-t-emerald-200 border-r-cyan-300 border-b-violet-400 border-l-lime-200 animate-[spin_3.5s_linear_infinite_reverse] shadow-[0_0_18px_4px_rgba(45,212,191,.45)]`} />
          <div className={`${common} -inset-1 border border-white/80 shadow-[inset_0_0_8px_rgba(167,243,208,.8)]`} />
          <span className="absolute -top-1 left-[18%] h-1.5 w-1.5 rounded-full bg-lime-100 shadow-[0_0_9px_3px_rgba(190,242,100,.95)] animate-pulse" />
          <span className="absolute bottom-0 right-[15%] h-1 w-1 rounded-full bg-cyan-100 shadow-[0_0_8px_3px_rgba(103,232,249,.95)] animate-pulse" />
        </>
      );

    // إطار الأوبسيديان: فخامة سوداء مع هالة ذهبية وشظايا كريستالية.
    case "obsidian":
      return (
        <>
          <div className={`${common} -inset-3 bg-[conic-gradient(from_45deg,transparent_0_12%,#fef3c7_17%,#d97706_23%,transparent_30%_52%,#fde68a_58%,#92400e_65%,transparent_73%_88%,#fef3c7_94%)] blur-xs opacity-90 animate-[spin_6s_linear_infinite]`} />
          <div className={`${common} -inset-2 border-[3px] border-transparent border-t-amber-200 border-r-yellow-600 border-b-amber-400 border-l-orange-300 animate-[spin_4s_linear_infinite_reverse] shadow-[0_0_15px_3px_rgba(245,158,11,.6)]`} />
          <div className={`${common} -inset-1 border border-amber-100/80`} />
          <span className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border border-yellow-100 bg-amber-300 shadow-[0_0_10px_3px_rgba(253,224,71,.95)]" />
          <span className="absolute bottom-[4%] left-[8%] h-1.5 w-1.5 rotate-45 border border-amber-100 bg-yellow-500 shadow-[0_0_8px_2px_rgba(245,158,11,.9)]" />
        </>
      );



    default:
      return null;
  }
}

export default function AvatarFrame({
  frameStyle,
  size = 80,
  children,
  className = "",
}) {
  const hasFrame = Boolean(frameStyle && frameStyle !== "default");

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full isolate ${className}`}
      style={{ width: size, height: size }}
    >
      {hasFrame && <FrameLayers style={frameStyle} />}
      <div
        className={`relative z-10 h-full w-full rounded-full overflow-hidden ${hasFrame ? "border-2 border-slate-950/80" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
