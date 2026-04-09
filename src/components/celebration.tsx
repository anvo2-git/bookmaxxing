"use client";

import { useEffect, useRef } from "react";

interface CelebrationProps {
  show: boolean;
  onComplete: () => void;
}

// Generate confetti particles with random properties
function createConfettiStyles(count: number) {
  const colors = ["#FF1493", "#FFD700", "#FF69B4", "#FF00FF", "#DDA0DD", "#FFF0F5", "#00FFFF", "#FF4500"];
  const shapes = ["circle", "square", "triangle"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    shape: shapes[i % shapes.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1,
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 200,
  }));
}

const confettiPieces = createConfettiStyles(60);

function playAirhorn() {
  try {
    const ctx = new AudioContext();

    // Layer 1: Main horn tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(220, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.05);
    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc1.connect(gain1).connect(ctx.destination);

    // Layer 2: Higher harmony
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(554, ctx.currentTime);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
    osc2.connect(gain2).connect(ctx.destination);

    // Layer 3: Sub bass punch
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sawtooth";
    osc3.frequency.setValueAtTime(110, ctx.currentTime);
    gain3.gain.setValueAtTime(0.3, ctx.currentTime);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc3.connect(gain3).connect(ctx.destination);

    // Layer 4: Noise burst for attack
    const bufferSize = ctx.sampleRate * 0.1;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = noiseBuffer;
    noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    noise.connect(noiseGain).connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc3.start(ctx.currentTime);
    noise.start(ctx.currentTime);

    osc1.stop(ctx.currentTime + 1.2);
    osc2.stop(ctx.currentTime + 1.0);
    osc3.stop(ctx.currentTime + 0.8);

    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Audio not available, silently fail
  }
}

export default function Celebration({ show, onComplete }: CelebrationProps) {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (show && !hasPlayed.current) {
      hasPlayed.current = true;
      playAirhorn();
      const timer = setTimeout(() => {
        onComplete();
        hasPlayed.current = false;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      {/* Confetti particles */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.shape === "triangle" ? 0 : piece.size,
            backgroundColor: piece.shape === "triangle" ? "transparent" : piece.color,
            borderLeft: piece.shape === "triangle" ? `${piece.size / 2}px solid transparent` : undefined,
            borderRight: piece.shape === "triangle" ? `${piece.size / 2}px solid transparent` : undefined,
            borderBottom: piece.shape === "triangle" ? `${piece.size}px solid ${piece.color}` : undefined,
            borderRadius: piece.shape === "circle" ? "50%" : "0",
            animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards`,
            transform: `rotate(${piece.rotation}deg)`,
            ["--drift" as string]: `${piece.drift}px`,
          }}
        />
      ))}

      {/* Center text */}
      <div
        className="relative z-10 text-center px-4"
        style={{ animation: "celebration-text 2s ease-out forwards" }}
      >
        <p className="font-circus text-3xl md:text-5xl text-[#FFD700] drop-shadow-[0_0_30px_rgba(255,215,0,0.6)]">
          Oh my god
        </p>
        <p className="font-circus text-2xl md:text-4xl text-[#FF69B4] mt-2 drop-shadow-[0_0_20px_rgba(255,105,180,0.6)]">
          she actually reads &lt;3
        </p>
        <p className="text-6xl mt-4" style={{ animation: "gentle-bounce 0.5s ease-in-out infinite" }}>
          📯🎉✨
        </p>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--drift)) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes celebration-text {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
          }
          30% {
            opacity: 1;
            transform: scale(1.2) rotate(3deg);
          }
          50% {
            transform: scale(1) rotate(0deg);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translateY(-30px);
          }
        }
      `}</style>
    </div>
  );
}
