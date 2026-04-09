"use client";

import type { User } from "better-auth";
import { Calendar, Link as LinkIcon, MapPin } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";

export default function Profile({ user }: { user: User }) {
  const { data, isPending } = useProfile(user.id);

  if (isPending) {
    return (
      <Card className="w-full overflow-hidden border-none shadow-md">
        <Skeleton className="h-48 w-full rounded-none" />
        <CardContent className="relative px-6 pb-6">
          <Skeleton className="absolute -top-16 left-6 h-32 w-32 rounded-full border-4 border-background" />
          <div className="mt-20 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    redirect("/auth/signin");
  }

  return (
    <Card className="w-full overflow-hidden border shadow-sm group">
      {/* Cover Image / Gradient Banner */}
      <div className="h-48 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        {/* Optional: Pattern Overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[20px_20px]"></div>
      </div>

      <CardContent className="relative px-6 pb-8 sm:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Avatar breakout */}
          <div className="relative -mt-16 sm:-mt-20 inline-block shrink-0">
            <div className="rounded-full border-4 border-background bg-background shadow-xl overflow-hidden h-32 w-32 sm:h-40 sm:w-40 relative z-10 transition-transform duration-500 group-hover:scale-105">
              <Image
                src={
                  data.image ||
                  "https://api.dicebear.com/9.x/glass/svg?seed=" + data.name
                }
                fill
                alt="avatar"
                className="object-cover"
                sizes="(max-width: 768px) 128px, 160px"
              />
            </div>
            {/* Glow effect behind avatar */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/40 blur-xl -z-10 animate-pulse"></div>
          </div>

          {/* Top Actions (Follow, Edit Profile, etc) can go here */}
          <div className="pt-2 sm:pt-0">
            {/* Stub button space for future "Edit Profile" */}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {/* User Info */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {data.name}
            </h1>
          </div>

          <p className="text-base leading-relaxed max-w-2xl text-foreground/90">
            {data.bio ||
              "Competitive programmer and algorithmic logic enthusiast. Building the future one test case at a time. Always eager to learn new data structures and optimize runtime."}
          </p>

          {/* User Meta tags */}
          <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-muted-foreground font-medium">
            {data.location && (
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                <MapPin className="w-4 h-4" />
                <span>{data.location}</span>
              </div>
            )}
            {data.website && (
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                <LinkIcon className="w-4 h-4" />
                <span className="text-indigo-500 hover:text-indigo-400">
                  {data.website}
                </span>
              </div>
            )}
            {data.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  Joined {new Date(data.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex gap-8 mt-4 pt-6 border-t">
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl">4</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Contests
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl">12</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Problems
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-rose-500">
                1st
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Global Rank
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
