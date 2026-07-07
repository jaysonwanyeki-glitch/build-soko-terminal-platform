const TYPE_COLOR: Record<string, [string, string]> = {
  ETF: ["#4ee8b0", "#0b8a4f"],
  REIT: ["#5fdaa0", "#006b3c"],
  "D-REIT": ["#5fdaa0", "#006b3c"],
  MMF: ["#00e676", "#00c853"],
  Fund: ["#34e0a0", "#00b865"],
};

const TYPE_ICON: Record<string, string> = {
  ETF: "📊",
  REIT: "🏢",
  "D-REIT": "🏗️",
  MMF: "💰",
  Fund: "📈",
};

export function FundAvatar({ type, size = 32 }: { type: string; size?: number }) {
  const [c1, c2] = TYPE_COLOR[type] ?? ["#ffb020", "#1fd585"];
  const icon = TYPE_ICON[type] ?? "📈";
  return (
    <span
      className="inline-grid shrink-0 place-items-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: size <= 36 ? 8 : 12,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        fontSize: size * 0.42,
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.25)",
      }}
    >
      {icon}
    </span>
  );
}
