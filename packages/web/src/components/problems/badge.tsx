import type { Difficulty } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

export function DifficultyBadge({
	difficulty,
}: {
	difficulty: Difficulty | 'none';
}) {
	const t = useTranslations();

	return (
		<Badge className={getColor(difficulty)}>
			{t(`Difficults.${difficulty}`)}
		</Badge>
	);
}

function getColor(difficulty: string) {
	switch (difficulty.toLocaleLowerCase()) {
		case 'easy':
			return 'bg-green-400';
		case 'medium':
			return 'bg-orange-400';
		case 'hard':
			return 'bg-red-400';
		default:
			return 'bg-gray-400';
	}
}
