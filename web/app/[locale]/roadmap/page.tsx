import { RoadmapList } from "./_components/list";

export default function RoadmapPage() {
  return (
    <div className="flex w-full flex-col flex-1 items-center gap-4 p-4">
      <div className="flex w-full max-w-4xl flex-1 flex-col gap-8 py-8">
        <RoadmapList />
      </div>
    </div>
  );
}
