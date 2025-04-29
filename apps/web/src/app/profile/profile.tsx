"use client";

import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string(),
	image: z.string().url(),
});

export default function Profile() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			image: "",
		},
	});

	const { mutate: updateUser } = api.user.update.useMutation();

	function onSubmit(values: z.infer<typeof formSchema>) {
		updateUser(values, {
			onSuccess() {
				toast({
					title: "Profile updated",
				});
			},
			onError() {
				toast({
					title: "Failed to update profile",
				});
			},
		});
	}

	return (
		<div className="flex p-8">
			<h1>Profile</h1>

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
					<Button type="submit">Submit</Button>
				</form>
			</Form>
		</div>
	);
}
