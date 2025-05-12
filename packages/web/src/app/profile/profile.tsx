"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { UpdateForm } from "./form";

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
					<Skeleton className="flex h-10 w-full items-center justify-center border-card" />
					<Skeleton className="flex h-10 w-full items-center justify-center border-card" />
					<Skeleton className="flex h-10 w-50 items-center justify-center border-card" />
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		signOut();
		return;
	}

	return (
		<div className="flex w-full flex-col gap-8">
			<UpdateForm user={data} />
		</div>
	);
}
