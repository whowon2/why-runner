'use client';

import type { Difficulty } from '@prisma/client';
import { Loader } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Session } from 'next-auth';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/trpc/react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { DifficultyBadge } from './badge';

interface ProblemFilters {
	my: boolean;
	difficulty?: Difficulty | 'ALL';
}

const difficultyOptions: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export function ProblemsList({ session }: { session: Session }) {
	const t = useTranslations('ProblemsPage');
	const router = useRouter();
	const searchParams = useSearchParams();

	// Extract filters from query
	const filters: ProblemFilters = {
		my: searchParams.get('my') === 'true',
		difficulty: searchParams.get('difficulty') as ProblemFilters['difficulty'],
	};

	const { data: problems, isPending } = api.problem.getAll.useQuery();

	// URL update helper
	const updateFilter = (
		key: keyof ProblemFilters,
		value: string | boolean | undefined,
	) => {
		const newParams = new URLSearchParams(searchParams.toString());

		if (
			value === undefined ||
			value === false ||
			value === '' ||
			value === 'ALL'
		) {
			newParams.delete(key);
		} else {
			newParams.set(key, String(value));
		}

		router.replace(`?${newParams.toString()}`);
	};

	const filteredProblems = useMemo(() => {
		if (!problems) return [];

		return problems.filter((p) => {
			if (filters.my && p.userId !== session.user.id) return false;
			if (filters.difficulty && p.difficulty !== filters.difficulty)
				return false;
			return true;
		});
	}, [problems, filters.difficulty, filters.my, session.user.id]);

	return (
		<div className="w-full max-w-7xl">
			<div className="flex justify-between">
				<h1 className="font-bold text-2xl">Problems</h1>
				<Link href={'/problems/new'}>
					<Button variant={'outline'}>{t('Create.button')}</Button>
				</Link>
			</div>

			{/* Filter UI */}
			<div className="flex items-center gap-4 p-4 border-b mt-4">
				<div className="flex items-center gap-2">
					<Checkbox
						id="my"
						checked={filters.my}
						onCheckedChange={(v) => updateFilter('my', !!v)}
					/>
					<Label htmlFor="my">{t('Filters.my')}</Label>
				</div>

				<div className="flex items-center gap-2">
					<Label htmlFor="difficulty">{t('Filters.difficulty')}</Label>
					<Select
						value={filters.difficulty}
						onValueChange={(e) => updateFilter('difficulty', e)}
					>
						<SelectTrigger>
							<SelectValue placeholder={t('Filters.Difficults.ALL')}>
								{t(`Filters.Difficults.${filters.difficulty}`)}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">{t('Filters.Difficults.ALL')}</SelectItem>
							{difficultyOptions.map((difficulty) => (
								<SelectItem key={difficulty} value={difficulty}>
									{t(`Filters.Difficults.${difficulty}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Filtered Problem List */}
			{isPending ? (
				<Loader className="animate-spin w-full mt-8" />
			) : (
				<div>
					{filteredProblems.map((problem) => (
						<Link href={`/problems/${problem.id}`} key={problem.id}>
							<div className="my-2 flex justify-between rounded-lg border p-4">
								<h3 className="font-bold">{problem.title}</h3>
								<DifficultyBadge difficulty={problem.difficulty} />
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
