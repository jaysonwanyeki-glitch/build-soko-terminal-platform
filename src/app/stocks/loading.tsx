import { PanelSkeleton } from "@/components/loading";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 rounded bg-term-700/50 animate-pulse" />
      <PanelSkeleton />
    </div>
  );
}
