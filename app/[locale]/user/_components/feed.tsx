import { Trophy, Code2, Heart, MessageSquare, Share2, Flame } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function Feed() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-neutral-900 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400">
            Activity Feed
          </h1>
          <p className="text-muted-foreground text-lg">
            See what you and your peers are up to.
          </p>
        </div>
      </div>

      <Separator className="w-full h-px bg-linear-to-r from-border to-transparent" />

      <div className="space-y-6">
        {/* Mock Post 1 (Contest) */}
        <Card className="hover:shadow-md transition-shadow overflow-hidden group">
          <div className="h-1.5 w-full bg-linear-to-r from-indigo-500 to-cyan-500"></div>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 shrink-0 group-hover:bg-indigo-500/20 transition-colors">
              <Trophy className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Do you have brio 2024</CardTitle>
              <CardDescription className="text-sm mt-1 font-medium text-muted-foreground">
                <span className="text-indigo-600 dark:text-indigo-400">Completed Contest</span> • 2 hours ago
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-5 bg-muted/30 rounded-xl border leading-relaxed text-[15px] dark:text-gray-300">
              Got 1st place on the contest. It was a tough one, but the dynamic programming problem at the end was really fun to solve!
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-muted/10 px-6 py-4 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 rounded-full px-4">
                <Heart className="w-4 h-4 mr-2" />
                24 Likes
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 rounded-full px-4">
                <MessageSquare className="w-4 h-4 mr-2" />
                5 Comments
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
              <Share2 className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Mock Post 2 (Problem) */}
        <Card className="hover:shadow-md transition-shadow overflow-hidden group">
          <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 to-teal-500"></div>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <Code2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">New Problem Published</CardTitle>
              <CardDescription className="text-sm mt-1 font-medium text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">Authored by you</span> • 5 hours ago
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-5 bg-muted/30 rounded-xl border leading-relaxed text-[15px] dark:text-gray-300">
              You published a new competitive programming problem: <span className="font-bold px-2 py-1 bg-background rounded-md border ml-1 shadow-sm">Weird Algorithm</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-muted/10 px-6 py-4 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 rounded-full px-4">
                <Heart className="w-4 h-4 mr-2" />
                12 Likes
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 rounded-full px-4">
                <MessageSquare className="w-4 h-4 mr-2" />
                Discuss
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
              <Share2 className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* End of feed */}
        <div className="flex flex-col items-center justify-center pt-8 pb-12 text-muted-foreground space-y-3">
          <div className="p-4 rounded-full bg-muted/30">
            <Flame className="w-8 h-8 text-orange-500/70" />
          </div>
          <p className="text-sm font-medium">You are all caught up!</p>
        </div>
      </div>
    </div>
  );
}
