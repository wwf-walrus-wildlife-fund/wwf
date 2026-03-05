interface GlowOrbProps {
  color?: string;
  size?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
}

const colorMap: Record<string, string> = {
  indigo: "72, 52, 212",
  purple: "108, 92, 231",
  cyan: "101, 200, 208",
  emerald: "16, 185, 129",
};

export function GlowOrb({
  color = "indigo",
  size = "400px",
  top,
  left,
  right,
  bottom,
  opacity = 0.15,
}: GlowOrbProps) {
  const rgb = colorMap[color] || colorMap.indigo;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        background: `repeating-linear-gradient(0deg, rgba(${rgb}, ${opacity}) 0 16px, transparent 16px 32px),
          repeating-linear-gradient(90deg, rgba(${rgb}, ${opacity * 0.8}) 0 16px, transparent 16px 32px)`,
        clipPath:
          "polygon(0 14%, 14% 14%, 14% 0, 43% 0, 43% 14%, 71% 14%, 71% 29%, 100% 29%, 100% 57%, 86% 57%, 86% 86%, 57% 86%, 57% 100%, 29% 100%, 29% 86%, 0 86%)",
        filter: "drop-shadow(0 0 18px rgba(0,0,0,0.45))",
      }}
    />
  );
}
