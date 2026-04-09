"use client";

import {
  ArrowDown,
  Bot,
  Code2,
  GraduationCap,
  Layers,
  Lock,
  Sparkles,
  Terminal,
  Trophy,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FlipWords } from "@/components/ui/flip-words";
import { Safari } from "@/components/ui/safari";
import { Link } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <main className="flex flex-col items-center justify-center flex-1 w-full overflow-hidden relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[40rem] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-multiply pointer-events-none dark:bg-indigo-500/20" />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 h-screen min-h-[800px] w-full  text-center -mt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-sm font-medium mb-8 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-cyan-500 font-semibold">
            The Future of Competitive Programming
          </span>
        </div>

        <div className="flex flex-col font-extrabold text-5xl tracking-tight sm:text-[6rem] leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          <div>
            <FlipWords words={["Uai", "Why", "The"]} />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-500">
              Runner
            </span>
          </div>
        </div>

        <p className="mt-6 text-xl text-muted-foreground max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          A premium algorithmic platform designed to empower students,
          instructors, and developers world-wide.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
          <Link href="contests">
            <Button
              size="lg"
              className="rounded-full px-8 h-12 text-base font-semibold shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.6)]"
            >
              {t("buttons.contests")}
            </Button>
          </Link>
          <Link href="problems">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 h-12 text-base font-semibold hover:bg-muted/50 backdrop-blur-md border-border/50 transition-all hover:scale-105"
            >
              {t("buttons.problems")}
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-10 animate-bounce cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
          <a href="#example" aria-label="Scroll down">
            <ArrowDown className="w-6 h-6" />
          </a>
        </div>
      </section>

      {/* Safari Preview */}
      <section
        className="w-full max-w-6xl px-4 text-center mt-10 space-y-8 relative "
        id="example"
      >
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {t("landing.submission.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("landing.submission.description")}
          </p>
        </div>

        <div className="relative w-full mt-16 group">
          <div className="absolute -inset-1 blur-2xl bg-linear-to-b from-indigo-500/20 to-purple-500/20 opacity-50 group-hover:opacity-70 transition duration-1000 rounded-[2rem]"></div>
          <div className="relative rounded-4xl border bg-background/50 backdrop-blur-sm p-2 shadow-2xl">
            <Safari
              url="why-runner.vercel.app"
              mode="simple"
              className="size-full rounded-2xl overflow-hidden"
              imageSrc="https://sysdty3yzpahzaza.public.blob.vercel-storage.com/example.png"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-6xl px-4 text-center mt-40 space-y-16 relative ">
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
            {t("landing.features.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-background/40 backdrop-blur-md border-border/50 hover:border-indigo-500/50 transition-colors shadow-sm hover:shadow-md text-left group">
            <CardContent className="p-8 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <Lock className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {t("landing.features.safe.title")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("landing.features.safe.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/40 backdrop-blur-md border-border/50 hover:border-purple-500/50 transition-colors shadow-sm hover:shadow-md text-left group">
            <CardContent className="p-8 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Bot className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {t("landing.features.ai.title")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("landing.features.ai.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/40 backdrop-blur-md border-border/50 hover:border-cyan-500/50 transition-colors shadow-sm hover:shadow-md text-left group">
            <CardContent className="p-8 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <Zap className="w-6 h-6 text-cyan-500" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {t("landing.features.realtime.title")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t("landing.features.realtime.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full max-w-6xl px-4 mt-40 space-y-16 relative ">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {t("landing.how.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-0.5 bg-linear-to-r from-transparent via-border to-transparent -" />

          {[
            {
              step: 1,
              title: t("landing.how.step1.title"),
              desc: t("landing.how.step1.description"),
            },
            {
              step: 2,
              title: t("landing.how.step2.title"),
              desc: t("landing.how.step2.description"),
            },
            {
              step: 3,
              title: t("landing.how.step3.title"),
              desc: t("landing.how.step3.description"),
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center space-y-4 relative bg-background/80 backdrop-blur-sm p-4 rounded-xl"
            >
              <div className="h-14 w-14 rounded-full bg-background border-4 border-indigo-500 flex items-center justify-center font-bold text-xl shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] ">
                {item.step}
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="w-full max-w-6xl px-4 mt-40 space-y-16 relative ">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {t("landing.usecases.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-none bg-transparent hover:bg-muted/20 transition-colors">
            <CardContent className="p-6 space-y-4 text-center flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full">
                <GraduationCap className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-bold">
                {t("landing.usecases.instructors.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("landing.usecases.instructors.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-transparent hover:bg-muted/20 transition-colors">
            <CardContent className="p-6 space-y-4 text-center flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full">
                <Code2 className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-bold">
                {t("landing.usecases.students.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("landing.usecases.students.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-transparent hover:bg-muted/20 transition-colors">
            <CardContent className="p-6 space-y-4 text-center flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full">
                <Trophy className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-bold">
                {t("landing.usecases.contests.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("landing.usecases.contests.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="w-full max-w-4xl px-4 text-center mt-40 mb-32 space-y-8 relative ">
        <h2 className="text-2xl font-bold tracking-tight text-muted-foreground uppercase">
          {t("landing.stack.title")}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Next.js",
            "Rust",
            "tRPC",
            "Drizzle",
            "PostgreSQL",
            "SQS",
            "Bun",
            "Docker",
          ].map((tech) => (
            <div
              key={tech}
              className="px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-default"
            >
              {tech}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
