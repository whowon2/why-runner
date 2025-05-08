import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { HydrateClient, api } from "@/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<main className="flex flex-col items-center justify-center">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<div className="flex font-extrabold text-5xl tracking-tight sm:text-[5rem]">
						<p className="p-2">Why</p>
						<span className="ml-4 text-[hsl(280,100%,70%)]">Runner</span>
					</div>
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
		</HydrateClient>
	);
}
