"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import Link from "next/link";

const formSchema = z.object({
	email: z.string().min(2).max(50),
	password: z.string().min(2).max(50),
});

export default function Signup() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const { mutate } = api.user.create.useMutation();

	function onSubmit(values: z.infer<typeof formSchema>) {
		mutate(values, {
			onSuccess: () => {
				alert("User created");
			},
			onError: () => {
				alert("Failed to create user");
			},
		});
	}

	return (
		<div className="mt-32 flex flex-col items-center justify-center">
			<h1 className="mb-8 font-bold text-3xl">Create an account</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="shadcn" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input placeholder="shadcn" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit">Sign up</Button>
				</form>
			</Form>

			<div className="mt-8">
				<span>
					Already have an account?{" "}
					<Button variant={"link"}>
						<Link className="text-blue-600" href="/auth/signin">
							Login
						</Link>
					</Button>
				</span>
			</div>
		</div>
	);
}
