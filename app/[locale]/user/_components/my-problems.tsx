import { FileCode, PlusCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function MyProblems() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-neutral-900 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400">
            My Problems
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your created algorithmic problems and test cases.
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/problems/new">
            <Button variant="outline">Create Problem</Button>
          </Link>
        </div>
      </div>

      <Separator className="w-full h-px bg-linear-to-r from-border to-transparent" />

      <Card className="border-dashed shadow-sm bg-muted/20 transition-all hover:bg-muted/30 hover:shadow-md border-2">
        <CardContent className="flex flex-col items-center justify-center p-14 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 mb-6 transition-transform hover:scale-110 hover:bg-indigo-500/20 cursor-default">
            <FileCode className="h-10 w-10 text-indigo-500" />
          </div>
          <CardTitle className="mb-3 text-2xl font-semibold">No problems yet</CardTitle>
          <CardDescription className="max-w-md mx-auto mb-8 text-base">
            You haven't authored any problems yet. Get started by designing your first coding problem and defining its test cases!
          </CardDescription>

          <div className="relative group">
            <div className="absolute -inset-1 blur-lg bg-linear-to-r from-indigo-500 to-cyan-500 opacity-20 group-hover:opacity-40 transition duration-500 rounded-lg"></div>
            <div className="relative">
              <Link href="/problems/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Problem
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
