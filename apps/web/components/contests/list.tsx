"use client";

import { CreateContestDialog } from "./create/dialog";

export function ContestList() {
  const { data: contests, refetch } = api.contest.find.useQuery({});

  return (
    <div className="flex flex-col p-8">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Contests</h1>
        <CreateContestDialog onCreate={refetch} />
      </div>

      {!contests && <ContestSkeletons />}

      {contests && contests.length === 0 && (
        <div className="flex h-32 items-center justify-center">
          <p className="text-gray-500">No contests found</p>
        </div>
      )}

      {contests && (
        <div>
          {contests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              refetchAction={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
