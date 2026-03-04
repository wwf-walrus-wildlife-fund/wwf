interface GlowOrbProps {
  color?: string;
  size?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
}

export function GlowOrb({
  color = "indigo",
  size = "400px",
  top,
  left,
  right,
  bottom,
  opacity = 0.15,
}: GlowOrbProps) {
  const colorMap: Record<string, string> = {
    indigo: "72, 52, 212",
    purple: "108, 92, 231",
    cyan: "101, 200, 208",
    emerald: "16, 185, 129",
  };
  const rgb = colorMap[color] || colorMap.indigo;

  return (
    <div
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        background: `radial-gradient(circle, rgba(${rgb}, ${opacity}) 0%, transparent 70%)`,
      }}
    />
  );
}