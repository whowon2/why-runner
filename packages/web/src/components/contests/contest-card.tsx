"use client";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import type { Prisma } from "@runner/db";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

export function ContestCard({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{ include: { UserOnContest: true } }>;
}) {
	return (
		<div
			key={contest.id}
			className="my-2 flex justify-between rounded-lg border p-4"
		>
			<Link href={`/contests/${contest.id}`}>
				<h3 className="hover:undeline font-bold">{contest.name}</h3>
			</Link>
		</div>
	);
}
