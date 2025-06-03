"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Prisma } from "@prisma/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(2).max(50),
});

export function EditContestForm({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
		};
	}>;
}) {
	const { mutate: updateContest, isPending } = api.contest.update.useMutation();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: contest.name,
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log(values);

		updateContest(
			{
				contestId: contest.id,
				name: values.name,
			},
			{
				onSuccess: () => {
					toast.success("Updated");
				},
				onError: (error) => {
					toast.error("Fail to update", { description: error.message });
				},
			},
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Do You Have Brio 2024" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button disabled={isPending} type="submit">
					{isPending ? "Saving changes..." : "Edit"}
				</Button>
			</form>
		</Form>
	);
}
