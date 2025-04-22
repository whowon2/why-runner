"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="flex text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          <p>Why</p>
          <span className="ml-4 text-[hsl(280,100%,70%)]">Runner</span>
        </h1>
        <p className="max-w-2xl text-center text-lg">
          Expand your programming skills and create contests to challenge your
          friends.
        </p>
        <div className="flex gap-4">
          <Link href="contests">
            <Button variant={"outline"}>Contests</Button>
          </Link>
          <Link href="problems">
            <Button variant={"secondary"}>Problems</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
