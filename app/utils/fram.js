
import React from "react";
import { User } from "lucide-react";

export function AngelicFrame() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -inset-[45%] z-20 h-[190%] w-[190%] max-w-none overflow-visible"
      fill="none"
    >
      <defs>
        {/* التدرجات */}
        <linearGradient id="angelGold" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff7c2" />
          <stop offset=".35" stopColor="#fbbf24" />
          <stop offset=".7" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fef3c7" />
        </linearGradient>

        <linearGradient id="angelBlue" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset=".4" stopColor="#bae6fd" />
          <stop offset=".75" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>

        <linearGradient id="angelPink" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fdf4ff" />
          <stop offset=".5" stopColor="#f9a8d4" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>

        {/* Glow */}
        <filter id="angelGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ================= OUTER ENERGY ================= */}

      <circle
        cx="200"
        cy="200"
        r="150"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeDasharray="18 20"
        opacity=".6"
        filter="url(#angelGlow)"
        className="origin-center animate-[spin_18s_linear_infinite]"
      />

      <circle
        cx="200"
        cy="200"
        r="158"
        stroke="#e879f9"
        strokeWidth="3"
        strokeDasharray="90 120"
        opacity=".65"
        filter="url(#angelGlow)"
        className="origin-center animate-[spin_12s_linear_infinite_reverse]"
      />

      {/* Halo */}
      <ellipse
        cx="200"
        cy="90"
        rx="95"
        ry="25"
        stroke="#bae6fd"
        strokeWidth="4"
        opacity=".75"
        filter="url(#angelGlow)"
        className="animate-pulse"
      />


      {/* ================= MAIN ORNAMENT RING ================= */}

      <circle
        cx="200"
        cy="205"
        r="115"
        stroke="url(#angelGold)"
        strokeWidth="7"
        filter="url(#angelGlow)"
      />

      <circle
        cx="200"
        cy="205"
        r="125"
        stroke="#7dd3fc"
        strokeWidth="2"
        strokeDasharray="8 14"
        opacity=".7"
        className="origin-center animate-[spin_10s_linear_infinite]"
      />

      {/* ================= TOP CRYSTAL ================= */}

      <g filter="url(#angelGlow)">
        <path
          d="M200 20 L230 75 L200 125 L170 75 Z"
          fill="url(#angelBlue)"
          stroke="url(#angelGold)"
          strokeWidth="6"
        />

        <path
          d="M200 40 L215 75 L200 105 L185 75 Z"
          fill="#ffffff"
          opacity=".8"
        />

        <path
          d="M170 75 L125 100 L160 115 L180 100 Z"
          fill="url(#angelGold)"
        />

        <path
          d="M230 75 L275 100 L240 115 L220 100 Z"
          fill="url(#angelGold)"
        />
      </g>

      {/* ================= BOTTOM CRYSTAL ================= */}

      <g filter="url(#angelGlow)">
        <path
          d="M200 280 L235 335 L200 390 L165 335 Z"
          fill="url(#angelBlue)"
          stroke="url(#angelGold)"
          strokeWidth="6"
        />

        <path
          d="M200 300 L217 335 L200 370 L183 335 Z"
          fill="#ffffff"
          opacity=".85"
        />

        <path
          d="M165 335 L125 315 L150 355 L180 350 Z"
          fill="url(#angelGold)"
        />

        <path
          d="M235 335 L275 315 L250 355 L220 350 Z"
          fill="url(#angelGold)"
        />
      </g>

      {/* ================= STARS ================= */}

      <g filter="url(#angelGlow)" className="animate-pulse">
        <path d="M65 130 L70 145 L85 150 L70 155 L65 170 L60 155 L45 150 L60 145 Z" fill="#fff" />
        <path d="M335 130 L340 145 L355 150 L340 155 L335 170 L330 155 L315 150 L330 145 Z" fill="#fff" />
        <path d="M90 285 L94 296 L105 300 L94 304 L90 315 L86 304 L75 300 L86 296 Z" fill="#93c5fd" />
        <path d="M310 285 L314 296 L325 300 L314 304 L310 315 L306 304 L295 300 L306 296 Z" fill="#f9a8d4" />
      </g>

      {/* Floating particles */}
      <circle cx="80" cy="210" r="4" fill="#fff" className="animate-pulse" />
      <circle cx="320" cy="210" r="4" fill="#f0abfc" className="animate-pulse" />
      <circle cx="115" cy="90" r="3" fill="#93c5fd" className="animate-ping" />
      <circle cx="285" cy="100" r="3" fill="#f9a8d4" className="animate-ping" />
    </svg>
  );
}


export function SingularityFrame() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -inset-[48%] z-20 h-[196%] w-[196%] max-w-none overflow-visible"
      fill="none"
    >
      <defs>
        <linearGradient id="voidEnergy" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7c3aed" />
          <stop offset=".35" stopColor="#d946ef" />
          <stop offset=".6" stopColor="#fb7185" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>

        <filter id="voidGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="blackHole">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="55%" stopColor="#03000a" />
          <stop offset="72%" stopColor="#581c87" />
          <stop offset="86%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#ffffff" />
        </radialGradient>
      </defs>

      {/* ================= COSMIC GLOW ================= */}

      <circle
        cx="200"
        cy="200"
        r="165"
        stroke="#7c3aed"
        strokeWidth="20"
        opacity=".15"
        filter="url(#voidGlow)"
        className="animate-pulse"
      />

      {/* ================= ENERGY STREAMS ================= */}

      <g
        className="origin-center animate-[spin_10s_linear_infinite]"
        filter="url(#voidGlow)"
      >
        <path
          d="M35 170 C80 40 230 25 355 130 C390 160 380 240 330 290"
          stroke="url(#voidEnergy)"
          strokeWidth="9"
          strokeLinecap="round"
        />

        <path
          d="M45 250 C110 370 275 375 360 250 C390 205 365 100 290 65"
          stroke="url(#voidEnergy)"
          strokeWidth="7"
          strokeLinecap="round"
          opacity=".9"
        />
      </g>

      <g
        className="origin-center animate-[spin_6s_linear_infinite_reverse]"
        filter="url(#voidGlow)"
      >
        <path
          d="M70 105 C180 35 330 80 360 190 C375 260 300 345 190 340"
          stroke="#e879f9"
          strokeWidth="4"
          strokeDasharray="90 30"
          strokeLinecap="round"
        />

        <path
          d="M45 220 C70 350 235 390 340 285"
          stroke="#8b5cf6"
          strokeWidth="5"
          strokeDasharray="55 25"
          strokeLinecap="round"
        />
      </g>

      {/* Inner vortex */}
      <circle
        cx="200"
        cy="200"
        r="125"
        stroke="#d946ef"
        strokeWidth="3"
        strokeDasharray="30 20"
        opacity=".8"
        filter="url(#voidGlow)"
        className="origin-center animate-[spin_4s_linear_infinite]"
      />

      <circle
        cx="200"
        cy="200"
        r="145"
        stroke="#8b5cf6"
        strokeWidth="3"
        strokeDasharray="120 80"
        opacity=".7"
        className="origin-center animate-[spin_14s_linear_infinite_reverse]"
      />

      {/* ================= ASTEROIDS ================= */}

      <g className="origin-center animate-[spin_16s_linear_infinite]">
        <path
          d="M45 125 L68 108 L90 122 L84 150 L58 155 L38 142 Z"
          fill="#130b20"
          stroke="#a855f7"
          strokeWidth="3"
          filter="url(#voidGlow)"
        />

        <path
          d="M315 85 L350 100 L362 132 L340 155 L305 135 Z"
          fill="#100817"
          stroke="#d946ef"
          strokeWidth="3"
          filter="url(#voidGlow)"
        />

        <path
          d="M300 310 L335 290 L370 320 L350 355 L310 350 Z"
          fill="#12091b"
          stroke="#8b5cf6"
          strokeWidth="3"
          filter="url(#voidGlow)"
        />

        <path
          d="M45 275 L78 260 L100 290 L80 325 L42 315 Z"
          fill="#130b20"
          stroke="#c026d3"
          strokeWidth="3"
          filter="url(#voidGlow)"
        />
      </g>

      {/* Small rocks */}
      <g
        fill="#160a22"
        stroke="#d946ef"
        strokeWidth="2"
        className="origin-center animate-[spin_8s_linear_infinite_reverse]"
      >
        <path d="M105 60 L118 52 L130 63 L122 78 L108 75 Z" />
        <path d="M275 45 L290 55 L286 70 L268 72 L260 58 Z" />
        <path d="M360 215 L375 208 L385 223 L374 240 L358 235 Z" />
        <path d="M30 220 L43 210 L58 223 L48 240 L33 237 Z" />
      </g>

      {/* ================= BLACK HOLES ================= */}

      <g filter="url(#voidGlow)" className="animate-[voidPulse_2.5s_ease-in-out_infinite]">
        <circle cx="320" cy="100" r="30" fill="url(#blackHole)" />
        <circle cx="320" cy="100" r="20" fill="#000" />
      </g>

      <g filter="url(#voidGlow)" className="animate-[voidPulse_3s_ease-in-out_infinite]">
        <circle cx="100" cy="300" r="17" fill="url(#blackHole)" />
        <circle cx="100" cy="300" r="11" fill="#000" />
      </g>

      <g filter="url(#voidGlow)" className="animate-[voidPulse_2s_ease-in-out_infinite]">
        <circle cx="270" cy="330" r="12" fill="url(#blackHole)" />
        <circle cx="270" cy="330" r="8" fill="#000" />
      </g>

      {/* ================= PARTICLES ================= */}

      <g filter="url(#voidGlow)">
        <circle cx="60" cy="80" r="3" fill="#fff" className="animate-ping" />
        <circle cx="120" cy="40" r="4" fill="#e879f9" className="animate-pulse" />
        <circle cx="220" cy="45" r="3" fill="#a855f7" className="animate-ping" />
        <circle cx="350" cy="250" r="4" fill="#f0abfc" className="animate-pulse" />
        <circle cx="220" cy="365" r="3" fill="#fff" className="animate-ping" />
        <circle cx="135" cy="355" r="4" fill="#d946ef" className="animate-pulse" />
      </g>
    </svg>
  );
}


export function PhoenixFrame() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -inset-[48%] z-20 h-[196%] w-[196%] max-w-none overflow-visible"
      fill="none"
    >
      <defs>
        <linearGradient id="phoenixFire" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff7ed" />
          <stop offset=".25" stopColor="#fed7aa" />
          <stop offset=".5" stopColor="#fb923c" />
          <stop offset=".75" stopColor="#ea580c" />
          <stop offset="1" stopColor="#7c2d12" />
        </linearGradient>

        <linearGradient id="phoenixEmber" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fde047" />
          <stop offset=".5" stopColor="#f97316" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>

        <radialGradient id="phoenixCore" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="80%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>

        <filter id="phoenixGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="phoenixSoftGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>


      {/* ================= OUTER EMBER RINGS ================= */}

      <circle
        cx="200"
        cy="200"
        r="155"
        stroke="#fdba74"
        strokeWidth="2"
        strokeDasharray="14 18"
        opacity=".6"
        filter="url(#phoenixSoftGlow)"
        className="origin-center animate-[spin_16s_linear_infinite]"
      />

      <circle
        cx="200"
        cy="200"
        r="147"
        stroke="#ea580c"
        strokeWidth="3"
        strokeDasharray="70 110"
        opacity=".7"
        filter="url(#phoenixGlow)"
        className="origin-center animate-[spin_9s_linear_infinite_reverse]"
      />

      {/* ================= MAIN ORNAMENT RING ================= */}

      <circle
        cx="200"
        cy="200"
        r="118"
        stroke="url(#phoenixFire)"
        strokeWidth="7"
        filter="url(#phoenixGlow)"
      />

      <circle
        cx="200"
        cy="200"
        r="127"
        stroke="#fed7aa"
        strokeWidth="2"
        strokeDasharray="6 12"
        opacity=".65"
        className="origin-center animate-[spin_11s_linear_infinite]"
      />

      {/* ================= LEFT WING ================= */}

      <g filter="url(#phoenixGlow)" className="origin-[200px_200px] animate-[wingFlutterLeft_3.2s_ease-in-out_infinite]">
        <path
          d="M85 205 C40 190 15 160 5 115 C35 130 55 130 78 145 C60 120 55 95 65 60 C90 85 100 105 108 135 C104 105 108 80 125 55 C138 90 138 115 130 150 C150 140 165 145 178 160 C150 165 128 178 110 200 Z"
          fill="url(#phoenixFire)"
          stroke="#fde68a"
          strokeWidth="2.5"
          opacity={0.1}
        />
        <path
          d="M100 165 C70 155 50 135 40 110"
          stroke="#fff7ed"
          strokeWidth="2"
          opacity=".7"
        />
        <path
          d="M112 148 C90 130 78 105 78 78"
          stroke="#fff7ed"
          strokeWidth="2"
          opacity=".6"
        />
      </g>

      {/* ================= RIGHT WING ================= */}

      <g filter="url(#phoenixGlow)" className="origin-[200px_200px] animate-[wingFlutterRight_3.2s_ease-in-out_infinite]">
        <path
          d="M315 205 C360 190 385 160 395 115 C365 130 345 130 322 145 C340 120 345 95 335 60 C310 85 300 105 292 135 C296 105 292 80 275 55 C262 90 262 115 270 150 C250 140 235 145 222 160 C250 165 272 178 290 200 Z"
          fill="url(#phoenixFire)"
          stroke="#fde68a"
          strokeWidth="2.5"
            opacity={0.1}
          
        />
        <path
          d="M300 165 C330 155 350 135 360 110"
          stroke="#fff7ed"
          strokeWidth="2"
          opacity=".7"
        />
        <path
          d="M288 148 C310 130 322 105 322 78"
          stroke="#fff7ed"
          strokeWidth="2"
          opacity=".6"
        />
      </g>

      {/* ================= HEAD CREST (FLAME) ================= */}

      <g filter="url(#phoenixGlow)" className="animate-[emberPulse_2.4s_ease-in-out_infinite]">
        <path
          d="M200 15 C210 45 225 55 232 78 C218 72 208 75 200 90 C192 75 182 72 168 78 C175 55 190 45 200 15 Z"
          fill="url(#phoenixCore)"
        />
        <path
          d="M200 35 C204 52 212 58 216 70 C208 66 204 68 200 76 C196 68 192 66 184 70 C188 58 196 52 200 35 Z"
          fill="#fff7ed"
          opacity=".85"
        />
      </g>

      {/* ================= FACE OPENING RING ================= */}

      <circle
        cx="200"
        cy="205"
        r="100"
        stroke="url(#phoenixEmber)"
        strokeWidth="4"
        opacity=".85"
        filter="url(#phoenixSoftGlow)"
      />

      {/* ================= TAIL FEATHERS (BOTTOM) ================= */}

      <g filter="url(#phoenixGlow)" className="animate-[emberPulse_3s_ease-in-out_infinite]">
        <path d="M160 320 C150 350 155 375 168 395 C172 370 178 355 185 335 Z" fill="url(#phoenixFire)" />
        <path d="M200 330 C196 358 200 380 200 400 C204 380 208 358 200 330 Z" fill="url(#phoenixEmber)" />
        <path d="M240 320 C250 350 245 375 232 395 C228 370 222 355 215 335 Z" fill="url(#phoenixFire)" />
      </g>

      {/* ================= FLOATING EMBERS ================= */}

      <g filter="url(#phoenixGlow)">
        <circle cx="70" cy="100" r="3.5" fill="#fde68a" className="animate-ping" />
        <circle cx="330" cy="100" r="3.5" fill="#fdba74" className="animate-ping" />
        <circle cx="55" cy="250" r="3" fill="#fb923c" className="animate-pulse" />
        <circle cx="345" cy="250" r="3" fill="#f97316" className="animate-pulse" />
        <circle cx="120" cy="365" r="2.5" fill="#fde047" className="animate-ping" />
        <circle cx="280" cy="365" r="2.5" fill="#fde047" className="animate-ping" />
        <circle cx="200" cy="120" r="2" fill="#fff7ed" className="animate-pulse" />
      </g>
    </svg>
  );
}




export function PinkButterflyFrame() {
  return (
    <svg
      viewBox="0 0 500 500"
      className="pointer-events-none absolute -inset-[45%] z-20 h-[190%] w-[190%] max-w-none overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes rjwHalo { 0%,100% { opacity:.28; transform:scale(1); } 50% { opacity:.5; transform:scale(1.06); } }
        @keyframes rjwOrbit { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes rjwFlutterL { 0%,100% { transform:rotate(0deg) scaleX(1); } 50% { transform:rotate(-14deg) scaleX(.72); } }
        @keyframes rjwFlutterR { 0%,100% { transform:rotate(0deg) scaleX(1); } 50% { transform:rotate(-14deg) scaleX(.72); } }
        @keyframes rjwSpire { 0%,100% { opacity:.55; transform:scale(.8); } 50% { opacity:1; transform:scale(1.2); } }
        @keyframes rjwFlap { 0%,100% { transform:scaleX(1); } 50% { transform:scaleX(.45); } }
        @keyframes rjwDrift { 0% { transform:translate(0,0); opacity:0; } 15% { opacity:1; } 85% { opacity:.7; } 100% { transform:translate(8px,-52px); opacity:0; } }
        @keyframes rjwTwinkle { 0%,100% { opacity:.3; transform:scale(.7); } 50% { opacity:1; transform:scale(1.25); } }
        @keyframes rjwRingPulse { 0%,100% { opacity:.85; } 50% { opacity:1; } }
      `}</style>

      <defs>
        <linearGradient id="rjwCrimson" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1f2" />
          <stop offset="30%" stopColor="#fb7185" />
          <stop offset="62%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#4c0519" />
        </linearGradient>

        <linearGradient id="rjwIndigo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="32%" stopColor="#c4b5fd" />
          <stop offset="64%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>

        <linearGradient id="rjwGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>

        <radialGradient id="rjwRuby" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="35%" stopColor="#fca5a5" />
          <stop offset="70%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>

        <radialGradient id="rjwHaloGrad">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0" />
          <stop offset="66%" stopColor="#fb7185" stopOpacity="0" />
          <stop offset="80%" stopColor="#e11d48" stopOpacity=".4" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="rjwCometGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity=".95" />
        </linearGradient>

        <filter id="rjwGlow" x="-140%" y="-140%" width="380%" height="380%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="rjwSoft" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <path id="rjwGem" d="M0 -7 L6 0 L0 7 L-6 0 Z" />

        {/* one wing (hind + fore + gold accent + veins + gems), mirrored for the right side */}
        <g id="rjwWing">
          <path
            d="M76 272 C48 292 22 316 8 348 C-3 372 12 390 35 383 C58 376 78 353 90 325 C97 308 92 290 76 272 Z"
            fill="url(#rjwIndigo)"
            stroke="url(#rjwGold)"
            strokeWidth="5"
          />
          <path
            d="M78 228 C48 208 20 178 5 140 C-8 108 8 82 32 88 C55 94 78 122 92 155 C100 175 95 200 78 228 Z"
            fill="url(#rjwCrimson)"
            stroke="url(#rjwGold)"
            strokeWidth="5"
          />
          <path
            d="M77 240 C58 224 42 202 34 176 C30 163 39 158 49 167 C64 182 76 203 84 223 C87 230 83 240 77 240 Z"
            fill="url(#rjwGold)"
            opacity=".85"
          />
          <g stroke="#fff" strokeWidth="1.8" opacity=".4" strokeLinecap="round">
            <path d="M82 212 C55 185 28 155 8 122" />
            <path d="M85 240 C52 232 22 216 2 198" />
            <path d="M80 266 C50 278 20 298 2 322" />
          </g>
          <use href="#rjwGem" x="42" y="118" fill="#fff" opacity=".95" filter="url(#rjwSoft)" />
          <use href="#rjwGem" x="63" y="155" fill="url(#rjwRuby)" opacity=".95" filter="url(#rjwSoft)" />
          <use href="#rjwGem" x="45" y="345" fill="url(#rjwRuby)" opacity=".95" filter="url(#rjwSoft)" />
          <use href="#rjwGem" x="70" y="305" fill="#fff" opacity=".85" filter="url(#rjwSoft)" />
        </g>

        {/* tiny orbiting companion butterfly, reused twice */}
        <g id="rjwMini">
          <path d="M0 -9 C-13 -18 -20 -7 -13 0 C-7 5 -2 5 0 1 Z" fill="url(#rjwCrimson)" stroke="url(#rjwGold)" strokeWidth="1.3" />
          <path d="M0 -9 C13 -18 20 -7 13 0 C7 5 2 5 0 1 Z" fill="url(#rjwIndigo)" stroke="url(#rjwGold)" strokeWidth="1.3" />
          <ellipse cx="0" cy="-2" rx="1.8" ry="6" fill="#4c0519" />
        </g>
      </defs>

      {/* ambient halo — a glowing ring, transparent through the middle by construction */}
      <circle
        cx="250"
        cy="250"
        r="245"
        fill="url(#rjwHaloGrad)"
        style={{ animation: "rjwHalo 4.2s ease-in-out infinite", transformOrigin: "250px 250px" }}
      />

      {/* slow outer sparkle ring */}
      <g style={{ animation: "rjwOrbit 30s linear infinite", transformOrigin: "250px 250px" }}>
        <circle cx="250" cy="250" r="215" stroke="url(#rjwGold)" strokeWidth="1.4" strokeDasharray="1 18 34 18" opacity=".5" fill="none" />
      </g>

      {/* bezel ring tracing the photo's edge, studded with gems */}
      <circle
        cx="250"
        cy="250"
        r="175"
        stroke="url(#rjwGold)"
        strokeWidth="4"
        fill="none"
        filter="url(#rjwSoft)"
        style={{ animation: "rjwRingPulse 3s ease-in-out infinite" }}
      />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x = 250 + 182 * Math.cos(a);
        const y = 250 + 182 * Math.sin(a);
        return (
          <use
            key={i}
            href="#rjwGem"
            x={x}
            y={y}
            fill={i % 3 === 0 ? "url(#rjwRuby)" : "#fff9f0"}
            opacity=".92"
            filter="url(#rjwSoft)"
          />
        );
      })}

      {/* a comet of light sweeping around the bezel */}
      <g style={{ animation: "rjwOrbit 2.2s linear infinite", transformOrigin: "250px 250px" }}>
        <path d="M425 250 A175 175 0 0 1 337.5 401.6" stroke="url(#rjwCometGrad)" strokeWidth="5" strokeLinecap="round" fill="none" filter="url(#rjwSoft)" />
      </g>

      {/* left wing */}
      <g filter="url(#rjwGlow)" style={{ animation: "rjwFlutterL 3s ease-in-out infinite", transformOrigin: "77px 250px" }}>
        <use href="#rjwWing" />
      </g>
      {/* right wing, mirrored */}
      <g transform="translate(500,0) scale(-1,1)">
        <g filter="url(#rjwGlow)" style={{ animation: "rjwFlutterR 3s ease-in-out infinite .12s", transformOrigin: "77px 250px" }}>
          <use href="#rjwWing" />
        </g>
      </g>

      {/* crown */}
      <g filter="url(#rjwGlow)">
        <path d="M225 82 C210 64 197 44 192 20 C190 10 198 8 205 18 C219 38 229 61 236 80 Z" fill="url(#rjwIndigo)" stroke="url(#rjwGold)" strokeWidth="3" />
        <path d="M275 82 C290 64 303 44 308 20 C310 10 302 8 295 18 C281 38 271 61 264 80 Z" fill="url(#rjwIndigo)" stroke="url(#rjwGold)" strokeWidth="3" />
        <path d="M244 78 L250 22 L256 78 Z" fill="url(#rjwCrimson)" stroke="url(#rjwGold)" strokeWidth="3" />
        <g style={{ animation: "rjwSpire 2.4s ease-in-out infinite", transformOrigin: "250px 24px" }}>
          <use href="#rjwGem" x="250" y="24" fill="url(#rjwRuby)" filter="url(#rjwSoft)" />
        </g>
        <g style={{ animation: "rjwSpire 2.4s ease-in-out infinite .3s", transformOrigin: "195px 22px" }}>
          <use href="#rjwGem" x="195" y="22" fill="#fff" filter="url(#rjwSoft)" />
        </g>
        <g style={{ animation: "rjwSpire 2.4s ease-in-out infinite .6s", transformOrigin: "305px 22px" }}>
          <use href="#rjwGem" x="305" y="22" fill="#fff" filter="url(#rjwSoft)" />
        </g>
      </g>

      {/* tassel */}
      <g filter="url(#rjwGlow)">
        <path d="M250 425 L250 470" stroke="url(#rjwGold)" strokeWidth="3" strokeLinecap="round" />
        <path d="M233 428 L202 462" stroke="url(#rjwGold)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M267 428 L298 462" stroke="url(#rjwGold)" strokeWidth="2.5" strokeLinecap="round" />
        <use href="#rjwGem" x="250" y="448" fill="#fff" filter="url(#rjwSoft)" />
        <g style={{ animation: "rjwSpire 2.4s ease-in-out infinite .2s", transformOrigin: "250px 472px" }}>
          <use href="#rjwGem" x="250" y="472" fill="url(#rjwRuby)" filter="url(#rjwSoft)" />
        </g>
        <use href="#rjwGem" x="202" y="465" fill="url(#rjwRuby)" filter="url(#rjwSoft)" />
        <use href="#rjwGem" x="298" y="465" fill="url(#rjwRuby)" filter="url(#rjwSoft)" />
      </g>

      {/* orbiting companion butterflies, well outside every ring */}
      <g style={{ animation: "rjwFlap 1.5s ease-in-out infinite", transformOrigin: "420px 130px" }}>
        <use href="#rjwMini" x="420" y="130" filter="url(#rjwSoft)" />
      </g>
      <g style={{ animation: "rjwFlap 1.5s ease-in-out infinite .4s", transformOrigin: "80px 370px" }}>
        <use href="#rjwMini" x="80" y="370" filter="url(#rjwSoft)" />
      </g>

      {/* sparkles */}
      <g filter="url(#rjwSoft)">
        {[
          [65, 55, 0],
          [435, 55, 0.4],
          [55, 445, 0.8],
          [445, 445, 1.2],
        ].map(([x, y, delay], i) => (
          <path
            key={i}
            d={`M${x} ${y - 13} L${x + 3} ${y - 3} L${x + 13} ${y} L${x + 3} ${y + 3} L${x} ${y + 13} L${x - 3} ${y + 3} L${x - 13} ${y} L${x - 3} ${y - 3} Z`}
            fill="#fff"
            style={{ animation: `rjwTwinkle 2.4s ease-in-out infinite ${delay}s`, transformOrigin: `${x}px ${y}px` }}
          />
        ))}
      </g>

      {/* drifting embers */}
      <g>
        {[
          [50, 260, "2.8s", "0s", "#fca5a5"],
          [450, 260, "3.2s", "0.5s", "#c4b5fd"],
          [160, 45, "3s", "1s", "#fbbf24"],
          [340, 45, "2.6s", "0.3s", "#fca5a5"],
        ].map(([x, y, dur, delay, c], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 2 === 0 ? 3 : 2.2}
            fill={c}
            style={{ animation: `rjwDrift ${dur} ease-in-out infinite ${delay}` }}
          />
        ))}
      </g>
    </svg>
  );
}


export function SovereignNebulaFrame() {
  return (
    <svg
      viewBox="0 0 500 500"
      className="pointer-events-none absolute -inset-[48%] z-20 h-[196%] w-[196%] max-w-none overflow-visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <style>{`
        @keyframes sovereignPulse {
          0%, 100% { opacity: .42; transform: scale(.96); }
          50% { opacity: .95; transform: scale(1.06); }
        }
        @keyframes sovereignOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sovereignOrbitReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes sovereignCore {
          0%, 100% { opacity: .7; transform: scale(.92); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        @keyframes sovereignCrown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes sovereignSpark {
          0%, 100% { opacity: .18; transform: scale(.45) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.35) rotate(45deg); }
        }
        @keyframes sovereignParticle {
          0% { opacity: 0; transform: translate(0, 16px) scale(.4); }
          20% { opacity: 1; }
          80% { opacity: .75; }
          100% { opacity: 0; transform: translate(8px, -34px) scale(1.1); }
        }
        @keyframes sovereignScan {
          0% { stroke-dashoffset: 0; opacity: .15; }
          50% { opacity: .9; }
          100% { stroke-dashoffset: -180; opacity: .15; }
        }
      `}</style>

      <defs>
        <radialGradient id="sovereignAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="55%" stopColor="#8b5cf6" stopOpacity="0" />
          <stop offset="73%" stopColor="#22d3ee" stopOpacity=".34" />
          <stop offset="88%" stopColor="#fbbf24" stopOpacity=".18" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="sovereignGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="28%" stopColor="#fcd34d" />
          <stop offset="58%" stopColor="#b45309" />
          <stop offset="78%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>

        <linearGradient id="sovereignPlatinum" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="35%" stopColor="#bae6fd" />
          <stop offset="65%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        <radialGradient id="sovereignCore" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="12%" stopColor="#67e8f9" />
          <stop offset="34%" stopColor="#2563eb" />
          <stop offset="64%" stopColor="#312e81" />
          <stop offset="86%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        <linearGradient id="sovereignComet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="35%" stopColor="#67e8f9" stopOpacity=".28" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="1" />
        </linearGradient>

        <filter
          id="sovereignGlow"
          x="-150%"
          y="-150%"
          width="400%"
          height="400%"
        >
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter
          id="sovereignSoftGlow"
          x="-150%"
          y="-150%"
          width="400%"
          height="400%"
        >
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <path id="sovereignDiamond" d="M0 -8 L7 0 L0 8 L-7 0 Z" />
      </defs>

      {/* هالة السديم */}
      <circle
        cx="250"
        cy="250"
        r="245"
        fill="url(#sovereignAura)"
        style={{
          animation: "sovereignPulse 5s ease-in-out infinite",
          transformOrigin: "250px 250px",
        }}
      />

      {/* شبكات ومدارات الطاقة */}
      <g
        style={{
          animation: "sovereignOrbit 28s linear infinite",
          transformOrigin: "250px 250px",
        }}
      >
        <ellipse
          cx="250"
          cy="250"
          rx="226"
          ry="92"
          stroke="url(#sovereignPlatinum)"
          strokeWidth="1.4"
          strokeDasharray="2 17 42 12"
          opacity=".7"
        />
        <ellipse
          cx="250"
          cy="250"
          rx="92"
          ry="226"
          stroke="url(#sovereignGold)"
          strokeWidth="1"
          strokeDasharray="1 22 28 18"
          opacity=".48"
        />
      </g>
      <g
        style={{
          animation: "sovereignOrbitReverse 19s linear infinite",
          transformOrigin: "250px 250px",
        }}
      >
        <ellipse
          cx="250"
          cy="250"
          rx="202"
          ry="202"
          stroke="url(#sovereignGold)"
          strokeWidth="2"
          strokeDasharray="1 31 55 18"
          opacity=".5"
        />
      </g>

      {/* إطار الطاقة الخارجي */}
      <circle
        cx="250"
        cy="250"
        r="178"
        stroke="url(#sovereignGold)"
        strokeWidth="5"
        opacity=".85"
        filter="url(#sovereignSoftGlow)"
      />
      <circle
        cx="250"
        cy="250"
        r="169"
        stroke="url(#sovereignPlatinum)"
        strokeWidth="1.5"
        strokeDasharray="3 9"
        opacity=".9"
      />
      <circle
        cx="250"
        cy="250"
        r="158"
        stroke="#67e8f9"
        strokeWidth="1"
        strokeDasharray="90 260"
        opacity=".7"
        style={{ animation: "sovereignScan 4s linear infinite" }}
      />

      {/* الماسات الملكية حول الحافة */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 22.5 * Math.PI) / 180;
        const x = 250 + 184 * Math.cos(angle);
        const y = 250 + 184 * Math.sin(angle);
        return (
          <use
            key={i}
            href="#sovereignDiamond"
            x={x}
            y={y}
            fill={i % 4 === 0 ? "#fef3c7" : "#67e8f9"}
            opacity={i % 4 === 0 ? ".98" : ".72"}
            filter="url(#sovereignSoftGlow)"
          />
        );
      })}

      {/* مذنب ضوئي سريع */}
      <g
        style={{
          animation: "sovereignOrbit 2.6s linear infinite",
          transformOrigin: "250px 250px",
        }}
      >
        <path
          d="M428 250 A178 178 0 0 1 339 404"
          stroke="url(#sovereignComet)"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#sovereignSoftGlow)"
        />
      </g>


      <g
        style={{
          animation: "sovereignCore 2.8s ease-in-out infinite",
          transformOrigin: "250px 250px",
        }}
      >
        <circle
          cx="250"
          cy="250"
          r="35"
          fill="#0c4a6e"
          opacity=".75"
          filter="url(#sovereignGlow)"
        />
        <circle
          cx="250"
          cy="250"
          r="18"
          fill="#e0f2fe"
          opacity=".95"
          filter="url(#sovereignSoftGlow)"
        />
      </g>

      {/* التاج العائم */}
      <g
        filter="url(#sovereignGlow)"
        style={{
          animation: "sovereignCrown 3.4s ease-in-out infinite",
          transformOrigin: "250px 92px",
        }}
      >
        <path
          d="M190 104 L202 42 L232 77 L250 24 L268 77 L298 42 L310 104 Z"
          fill="url(#sovereignPlatinum)"
          stroke="url(#sovereignGold)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M194 101 Q250 125 306 101 L300 118 Q250 138 200 118 Z"
          fill="url(#sovereignGold)"
          stroke="#fef3c7"
          strokeWidth="2"
        />
        <use
          href="#sovereignDiamond"
          x="250"
          y="27"
          fill="#fef08a"
          filter="url(#sovereignSoftGlow)"
        />
        <use
          href="#sovereignDiamond"
          x="202"
          y="45"
          fill="#67e8f9"
          filter="url(#sovereignSoftGlow)"
        />
        <use
          href="#sovereignDiamond"
          x="298"
          y="45"
          fill="#c4b5fd"
          filter="url(#sovereignSoftGlow)"
        />
      </g>

      {/* شظايا كونية */}
      {[
        [70, 105, 0],
        [430, 105, 0.4],
        [62, 394, 0.8],
        [438, 394, 1.2],
        [105, 250, 1.6],
        [395, 250, 2],
      ].map(([x, y, delay], i) => (
        <path
          key={i}
          d={`M${x} ${y - 13} L${x + 3} ${y - 3} L${x + 13} ${y} L${x + 3} ${y + 3} L${x} ${y + 13} L${x - 3} ${y + 3} L${x - 13} ${y} L${x - 3} ${y - 3} Z`}
          fill={i % 2 === 0 ? "#fef3c7" : "#a5f3fc"}
          style={{
            animation: `sovereignSpark 2.6s ease-in-out infinite ${delay}s`,
            transformOrigin: `${x}px ${y}px`,
          }}
          filter="url(#sovereignSoftGlow)"
        />
      ))}

      {/* جزيئات صاعدة */}
      <g>
        {[
          [76, 286, "3.2s", "0s", "#67e8f9"],
          [424, 286, "3.6s", ".5s", "#fcd34d"],
          [145, 82, "3s", "1s", "#c4b5fd"],
          [355, 82, "2.8s", ".3s", "#67e8f9"],
          [128, 418, "3.4s", "1.4s", "#fcd34d"],
          [372, 418, "3.1s", "1.8s", "#c4b5fd"],
        ].map(([x, y, duration, delay, color], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 2 === 0 ? 3 : 2}
            fill={color}
            style={{
              animation: `sovereignParticle ${duration} ease-in-out infinite ${delay}`,
            }}
            filter="url(#sovereignSoftGlow)"
          />
        ))}
      </g>
    </svg>
  );
}




export default function Preview() {
  return (
    <div className="relative flex h-[640px] w-full items-center justify-center overflow-visible bg-linear-to-br from-black via-[#1a0510] to-[#2a0a1f]">
      {/* a neutral placeholder avatar — proof that the middle stays clear */}
      <div className="relative h-56 w-56">
        <div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-neutral-700 to-neutral-900">
          <User className="h-24 w-24 text-neutral-400" strokeWidth={1.2} />
        </div>
        <PinkButterflyFrame />
      </div>
    </div>
  );
}
