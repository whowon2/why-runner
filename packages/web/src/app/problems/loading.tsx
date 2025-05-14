import { BreadCrumbs } from "@/components/header/breadcrumbs";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { ProblemsList } from "./list";

export default async function Loading() {
	return (
		<div className="flex w-full flex-col items-center justify-center gap-8 p-8">
			<BreadCrumbs />
		</div>
	);
}
