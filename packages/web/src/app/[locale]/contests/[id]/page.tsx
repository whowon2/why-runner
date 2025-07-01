import { Pencil, Trophy } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { BreadCrumbs } from '@/components/breadcrumbs';
import { ContestDescription } from '@/components/contests/description';
import { JoinButton } from '@/components/contests/join';
import { Leaderboard } from '@/components/contests/leaderboard';
import { ProblemTab } from '@/components/contests/tabs/problem';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from '@/i18n/navigation';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';
import { ContestStatus } from '@/components/contests/status';

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const t = await getTranslations('ContestsPage');

	const session = await auth();

	if (!session) {
		redirect('/api/auth/signin');
	}

	const contest = await api.contest.findById(id);

	if (!contest) {
		return <div className='flex justify-center items-center min-h-screen'>Torneio não encontrado</div>;
	}

	const isCreatedByUser = contest.createdById === session.user.id;

	return (
		<div className="flex w-full flex-col items-center justify-center gap-4 p-4">
			<BreadCrumbs />
			<div className="flex flex-col items-center">
				<div className="flex gap-2">
					<h1 className="font-bold text-3xl">{contest.name}</h1>
					{isCreatedByUser && (
						<Link href={`${contest.id}/edit`}>
							<Pencil size={18} />
						</Link>
					)}
				</div>
				<JoinButton
					contest={contest}
					isCreatedByUser={isCreatedByUser}
					session={session}
				/>
			</div>

      <ContestStatus contest={contest} />

			<Tabs className="w-full" defaultValue="problems">
				<TabsList className="w-full justify-start rounded-none border-b bg-background p-0">
					<TabsTrigger
						className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
						value="problems"
					>
						{t('Tabs.problems')}
					</TabsTrigger>
					<TabsTrigger
						className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
						value="leaderboard"
					>
						{t('Tabs.leaderboard')}
						<Trophy />
					</TabsTrigger>
					<TabsTrigger
						className="h-full rounded-none border border-transparent border-b-[3px] bg-background data-[state=active]:border-primary data-[state=active]:shadow-none"
						value="description"
					>
						{t('Tabs.description')}
					</TabsTrigger>
				</TabsList>

				<TabsContent className="flex w-full gap-4" value="problems">
					<ProblemTab contest={contest} session={session} />
				</TabsContent>
				<TabsContent value="leaderboard">
					<Leaderboard contest={contest} />
				</TabsContent>
				<TabsContent value="description">
					<ContestDescription contest={contest} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
