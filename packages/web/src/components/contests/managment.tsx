'use client';

import type { Contest } from '@prisma/client';
import { Copy, FileCode2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { api } from '@/trpc/react';

export function ContestManagement({ contest }: { contest: Contest }) {
	const t = useTranslations('ContestsPage.Tabs.Management');
	const { data: submissions } = api.submission.findByContest.useQuery(
		{
			contestId: contest.id,
		},
		{
			refetchInterval: 5000,
		},
	);

	return (
		<div className="flex flex-col gap-4">
			<Card className="bg-transparent">
				<CardHeader>
					<CardTitle>Submissions ({submissions?.length ?? 0})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>User</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Problem</TableHead>
								<TableHead>Code</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{submissions?.map((submission) => (
								<TableRow key={submission.id}>
									<TableCell className="font-mono text-xs">
										<Copy
											size={16}
											className="cursor-pointer"
											onClick={() => {
												navigator.clipboard.writeText(submission.id);
												toast.success(t('id_copied'));
											}}
										/>
									</TableCell>
									<TableCell>{submission.user.name}</TableCell>
									<TableCell>{submission.status}</TableCell>
									<TableCell>
										{new Date(submission.createdAt).toLocaleTimeString()}
									</TableCell>
									<TableCell>{submission.problem.title}</TableCell>
									<TableCell>
										<FileCode2 size={16} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
