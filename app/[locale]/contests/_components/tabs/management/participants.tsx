"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getParticipants } from "@/lib/actions/contest/get-participants";

export function Participants({ contestId }: { contestId: string }) {
  const { data: participants = [] } = useQuery({
    queryKey: ["participants", contestId],
    queryFn: () => getParticipants(contestId),
  });

  if (participants.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {participants.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center gap-3 rounded border p-3"
          >
            {entry.user.image && (
              <img
                src={entry.user.image}
                alt={entry.user.name}
                className="h-8 w-8 rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-sm">{entry.user.name}</p>
              <p className="text-xs text-muted-foreground">{entry.user.email}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
