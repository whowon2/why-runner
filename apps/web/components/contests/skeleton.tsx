import { Skeleton } from "@/components/ui/skeleton";

export function ContestSkeletons() {
  return (
    <div className="flex flex-col">
      <Skeleton className="my-2 rounded-lg border p-8" />
      <Skeleton className="my-2 rounded-lg border p-8" />
      <Skeleton className="my-2 rounded-lg border p-8" />
      <Skeleton className="my-2 rounded-lg border p-8" />
    </div>
  );
}
