import { Loader } from "lucide-react";

export default async function Loading() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 p-4">
      <Loader className="animate-spin" />
    </div>
  );
}
