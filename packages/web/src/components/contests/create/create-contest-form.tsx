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
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(2).max(50),
	startDate: z.string().refine(
		(dateStr) => {
			const date = new Date(dateStr);
			return !Number.isNaN(date.getTime()) && date > new Date();
		},
		{
			message: "Start Date must be in the future",
		},
	),
	duration: z.coerce.number().min(15),
});

export function CreateContestForm({
	onSuccessAction,
}: {
	onSuccessAction: () => void;
}) {
	const { mutate: createContest, isPending } = api.contest.create.useMutation();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log(values);

		const startDate = new Date(values.startDate);
		const endDate = new Date(startDate.getTime() + values.duration * 60 * 1000);

		createContest(
			{
				name: values.name,
				startDate,
				endDate,
			},
			{
				onSuccess: () => {
					console.log("success");
					onSuccessAction();
				},
				onError: (error) => {
					console.log("error", error);
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

				<FormField
					control={form.control}
					name="startDate"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Date and Time</FormLabel>
							<FormControl>
								<Input
									type="datetime-local"
									placeholder="Do You Have Brio 2024"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="duration"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Duration</FormLabel>
							<FormControl>
								<Input type="number" placeholder="15" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<DialogFooter>
					<Button disabled={isPending} type="submit">
						{isPending ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
