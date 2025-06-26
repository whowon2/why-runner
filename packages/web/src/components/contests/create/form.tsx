'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { api } from '@/trpc/react';

const formSchema = z.object({
	duration: z.coerce.number().min(15),
	name: z.string().min(2).max(50),
	startDate: z.string().refine(
		(dateStr) => {
			const date = new Date(dateStr);
			return !Number.isNaN(date.getTime()) && date > new Date();
		},
		{
			message: 'Start Date must be in the future',
		},
	),
});

export function CreateContestForm({
	onSuccessAction,
}: {
	onSuccessAction: () => void;
}) {
	const { mutate: createContest, isPending } = api.contest.create.useMutation();

	const form = useForm<z.infer<typeof formSchema>>({
		defaultValues: {
			duration: 15,
			name: '',
			startDate: '',
		},
		resolver: zodResolver(formSchema),
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log(values);

		const startDate = new Date(values.startDate);
		const endDate = new Date(startDate.getTime() + values.duration * 60 * 1000);

		createContest(
			{
				endDate,
				name: values.name,
				startDate,
			},
			{
				onError: (error) => {
					toast.error('Failed to create contest', {
						description: error.message,
					});
				},
				onSettled: () => onSuccessAction(),
				onSuccess: () => {
					toast.success('Contest Created');
				},
			},
		);
	}

	return (
		<Form {...form}>
			<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
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
									placeholder="Do You Have Brio 2024"
									type="datetime-local"
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
								<Input placeholder="15" type="number" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<DialogFooter>
					<Button disabled={isPending} type="submit">
						{isPending ? 'Creating...' : 'Create'}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
