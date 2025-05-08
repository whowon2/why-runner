"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CreateContestForm } from "./create-contest-form";

export function CreateContestDialog({ onCreate }: { onCreate: () => void }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">Create Contest</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create Contest</DialogTitle>
				</DialogHeader>
				<CreateContestForm
					onSuccessAction={() => {
						setIsOpen(false);
						onCreate();
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}
