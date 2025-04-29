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
import { toast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formSchema = z.object({
	email: z.string().min(2).max(50),
	password: z.string().min(2).max(50),
});

export default function Signin() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const router = useRouter();

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const response = await signIn("credentials", {
				email: values.email,
				password: values.password,
				redirect: false,
			});

			if (!response?.error) {
				router.push("/");
				router.refresh();
			}

			if (!response?.ok) {
				throw new Error("Network response was not ok");
			}
			// Process response here
			console.log("Login Successful", response);
			toast({ title: "Login Successful" });
		} catch (error: any) {
			console.error("Login Failed:", error);
			toast({ title: "Login Failed", description: error.message });
		}
	}

	return (
		<div className="mt-32 flex flex-col items-center justify-center">
			<h1 className="mb-8 font-bold text-3xl">Welcome Back</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
					<Button type="submit">Login</Button>
				</form>
			</Form>

			{/* github */}
			<Button
				onClick={() => {
					signIn("github");
				}}
			>
				Github
			</Button>

			<div className="mt-8">
				<span>Don't have an account?</span>
				<Button variant={"link"}>
					<Link className="text-blue-600" href="/auth/signup">
						Signup
					</Link>
				</Button>
			</div>
		</div>
	);
}
