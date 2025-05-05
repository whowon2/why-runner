"use client";

import { api } from "@/trpc/react";
import { LoaderCircle } from "lucide-react";
import type { Session } from "next-auth";
import { UpdateForm } from "./form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "next-auth/react";

export default function Profile({ session }: { session: Session }) {
  const { data, isPending } = api.user.get.useQuery({
    userId: session.user.id,
  });

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <Skeleton className="w-full h-10 border-card flex items-center justify-center" />
          <Skeleton className="w-full h-10 border-card flex items-center justify-center" />
          <Skeleton className="w-50 h-10 border-card flex items-center justify-center" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    signOut();
    return;
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <UpdateForm user={data} />
    </div>
  );
}
