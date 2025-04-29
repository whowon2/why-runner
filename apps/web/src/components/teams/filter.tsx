"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FilterTeams() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	function handleSearch(term: string) {
		const params = new URLSearchParams(searchParams);

		if (term) {
			params.set("query", term);
		} else {
			params.delete("query");
		}

		router.replace(`${pathname}?${params.toString()}`);
	}

	return (
		<div className="w-full max-w-sm p-8">
			<h1 className="mb-4 font-bold text-xl">Search</h1>
			<Input
				placeholder="Search teams"
				className="w-full"
				onChange={(e) => handleSearch(e.target.value)}
			/>
		</div>
	);
}
