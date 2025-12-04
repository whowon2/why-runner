"use client";

import type { User } from "better-auth";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/use-profile";

export default function Profile({ user }: { user: User }) {
  const { data, isPending } = useProfile(user.id);

  if (isPending) {
    return <Card className="w-full"></Card>;
  }

  if (!data) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <Card className="">
        <CardContent>
          <div className="flex gap-4">
            <Image
              src={data.image ?? ""}
              height={100}
              width={100}
              alt="avatar"
              className="rounded-full border-4"
            />
            <div className="flex flex-col">
              <div className="font-bold text-xl">{data.name}</div>
              <div className="">{data.bio ?? "Bio:"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
