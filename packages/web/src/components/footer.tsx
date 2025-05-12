import { GithubIcon } from "@/assets/icons";
import Image from "next/image";
import { Button } from "./ui/button";

export function Footer() {
	return (
		<footer className="mt-10 flex flex-col items-center gap-2 border-t p-4 text-center text-gray-500 text-sm">
			© 2025 Juan Israel • Final Year Project – Code Execution System
			<br />
			<div className="flex gap-4">
				<a
					href="https://github.com/juanisrael/code-runner"
					target="_blank"
					className="flex underline"
					rel="noreferrer"
				>
					<figure className="w-6">
						<GithubIcon />
					</figure>
				</a>
			</div>
		</footer>
	);
}
