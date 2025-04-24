"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { BACKEND_URL } from "@/lib/constants";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SigninResponse {
	id: string;
}

const formSchema = z.object({
	email: z.string().email({
		message: "Invalid email address.",
	}),
	password: z.string().min(8, {
		message: "Password must be at least 8 characters.",
	}),
});

export function SigninForm({ callbackUrl }: { callbackUrl?: string }) {
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const res = await axios.post<SigninResponse>(
				`${BACKEND_URL}/auth/signin`,
				values,
			);

			router.push(callbackUrl || "/");
		} catch (error) {
			if (error instanceof AxiosError) {
				toast.error(error.message);
			} else {
				console.log(error);
				toast.error("Unexpected error occurred");
			}
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="nevercoder@example.com"
									{...field}
								/>
							</FormControl>
							<FormDescription>This is your email address.</FormDescription>
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
								<Input type="password" placeholder="********" {...field} />
							</FormControl>
							<FormDescription>This is your password.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className="w-full" type="submit">
					Login
				</Button>
			</form>

			<div className="mt-4">
				Don't have an account yet?{" "}
				<Link href="/auth/signup" className="underline">
					Signup
				</Link>
			</div>
		</Form>
	);
}
