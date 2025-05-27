import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
          <span className="text-[hsl(280,100%,70%)]">Why</span>Runner
        </h1>
      </div>
      <div className="flex gap-4">
        <Link href="contests">
          <Button className="cursor-pointer" variant={"outline"}>
            Contests
          </Button>
        </Link>
        <Link href="problems">
          <Button className="cursor-pointer" variant={"outline"}>
            Problems
          </Button>
        </Link>
      </div>
    </main>
  );
}
