import { ProblemsList } from "@/components/problems/list";
import { prisma } from "@repo/db";
import Image from "next/image";

export default async function Home() {
  const problems = await prisma.problem.findMany();

  return (
    <div className="min-h-screen flex flex-col p-8 font-[family-name:var(--font-source-code-pro)]">
      <ProblemsList problems={problems} />
    </div>
  );
}
