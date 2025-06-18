'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Prisma } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
		defaultValues: {
			name: contest.name,
		},
		resolver: zodResolver(formSchema),
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log(values);

		updateContest(
			{
				contestId: contest.id,
				name: values.name,
			},
			{
				onError: (error) => {
					toast.error('Fail to update', { description: error.message });
				},
				onSuccess: () => {
					toast.success('Updated');
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
				<Button disabled={isPending || !form.formState.isDirty} type="submit">
					{isPending ? 'Saving changes...' : 'Save'}
				</Button>
			</form>
		</Form>
	);
}
