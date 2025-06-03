"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import type { User } from "next-auth";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const updateProfileSchema = z.object({
	name: z.string(),
	image: z.union([z.string().url(), z.literal("")]),
});

export function UpdateForm({ user }: { user: User }) {
	const form = useForm<z.infer<typeof updateProfileSchema>>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			name: user.name ?? "",
			image: user.image ?? "",
		},
	});

	const utils = api.useUtils();

	const { mutate: updateUser } = api.user.update.useMutation();

	async function onSubmit(values: z.infer<typeof updateProfileSchema>) {
		updateUser(values, {
			async onSuccess() {
				utils.user.invalidate();

				toast("Profile updated");
			},
			onError() {
				toast("Failed to update profile");
			},
		});
	}
	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input placeholder="shadcn" {...field} />
									</FormControl>
									<FormDescription>
										This is your public display name.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="image"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Avatar URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://example.com/avatar.png"
											{...field}
										/>
									</FormControl>
									<FormDescription>This is your public avatar.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<Button
										type="submit"
										disabled={!form.formState.isDirty}
										variant={"default"}
									>
										<Save />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Save Profile</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
