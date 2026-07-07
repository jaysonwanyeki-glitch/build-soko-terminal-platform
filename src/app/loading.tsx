import { PanelSkeleton } from "@/components/loading";

export default function Loading() {
  return (
    <div className="space-y-4">
      <PanelSkeleton />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
      <PanelSkeleton />
    </div>
  );
}
