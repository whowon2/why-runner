"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const formSchema = z.object({
	email: z.string().min(2).max(50),
	password: z.string().min(2).max(50),
	name: z.string().min(4).max(50),
});

export function SignupForm({ callbackUrl }: { callbackUrl: string }) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			name: "",
			password: "",
		},
	});

	const { mutate: signupMutation } = api.user.signup.useMutation();

	const router = useRouter();

	async function onSubmit(values: z.infer<typeof formSchema>) {
		signupMutation(values, {
			onSuccess: () => {
				toast.success("Account created");
				router.push(`/auth/signin?callbackURL=${callbackUrl}`);
			},
			onError: ({ data, message }) => {
				toast.error(message);
			},
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">Login</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-6"
					>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="shadcn" type="email" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
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
										<Input type="password" placeholder="shadcn" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit">Register</Button>

						<div className="mt-4 text-center text-sm">
							Already have an account?{" "}
							<a
								href={`/auth/signin?callbackUrl=${callbackUrl}`}
								className="underline underline-offset-4"
							>
								Sign in
							</a>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
