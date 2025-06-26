'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import type { User } from 'next-auth';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/trpc/react';

const updateProfileSchema = z.object({
	image: z.union([z.string().url(), z.literal('')]),
	name: z.string(),
});

export function UpdateForm({ user }: { user: User }) {
	const form = useForm<z.infer<typeof updateProfileSchema>>({
		defaultValues: {
			image: user.image ?? '',
			name: user.name ?? '',
		},
		resolver: zodResolver(updateProfileSchema),
	});

	const utils = api.useUtils();

	const { mutate: updateUser } = api.user.update.useMutation();

	async function onSubmit(values: z.infer<typeof updateProfileSchema>) {
		updateUser(values, {
			onError() {
				toast('Failed to update profile');
			},
			async onSuccess() {
				utils.user.invalidate();

				toast('Profile updated');
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
					<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
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
										disabled={!form.formState.isDirty}
										type="submit"
										variant={'default'}
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
