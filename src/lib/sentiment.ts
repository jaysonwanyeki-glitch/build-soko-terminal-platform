// A Kenyan market Fear & Greed sentiment gauge. Blends breadth, momentum and
// the NSE All-Share behaviour into a 0–100 score.

export type Sentiment = {
  score: number;
  label: string;
  color: string;
  factors: { label: string; score: number; detail: string }[];
};

export function buildSentiment(opts: {
  advancers: number;
  decliners: number;
  nasiChange: number;
  topMoverPct: number;
  volumeSpike: number;
}): Sentiment {
  const { advancers, decliners, nasiChange, topMoverPct, volumeSpike } = opts;
  const total = advancers + decliners || 1;

  // breadth component 0–100
  const breadth = Math.round((advancers / total) * 100);
  // momentum from index change (-5% → 0, +5% → 100)
  const momentum = Math.round(Math.max(0, Math.min(100, ((nasiChange + 5) / 10) * 100)));
  // rally strength from best mover
  const rally = Math.round(Math.max(0, Math.min(100, (Math.abs(topMoverPct) / 8) * 100)));
  // volume / activity
  const activity = Math.round(Math.max(0, Math.min(100, volumeSpike)));

  const score = Math.round(breadth * 0.4 + momentum * 0.35 + rally * 0.15 + activity * 0.1);

  let label = "Neutral";
  let color = "#7dffba";
  if (score >= 75) {
    label = "Extreme Greed";
    color = "#00e676";
  } else if (score >= 55) {
    label = "Greed";
    color = "#4ee8b0";
  } else if (score >= 45) {
    label = "Neutral";
    color = "#7dffba";
  } else if (score >= 25) {
    label = "Fear";
    color = "#bb6b00";
  } else {
    label = "Extreme Fear";
    color = "#ff5d75";
  }

  const factors = [
    { label: "Market Breadth", score: breadth, detail: `${advancers} advancers / ${decliners} decliners` },
    { label: "Index Momentum", score: momentum, detail: `NASI ${nasiChange >= 0 ? "+" : ""}${nasiChange.toFixed(2)}%` },
    { label: "Rally Strength", score: rally, detail: `Top mover ${topMoverPct >= 0 ? "+" : ""}${topMoverPct.toFixed(1)}%` },
    { label: "Trading Activity", score: activity, detail: `${volumeSpike.toFixed(0)}% of average volume` },
  ];

  return { score, label, color, factors };
}
