'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';
import { FlipWords } from '@/components/ui/flip-words';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function Home() {
	const t = useTranslations('HomePage');

	return (
		<main className="flex flex-col items-center justify-center flex-1 -mt-40">
			<div className="flex flex-col items-center justify-center px-4 py-16">
				<div className="flex font-extrabold text-5xl tracking-tight sm:text-[5rem]">
					<FlipWords words={['Uai', 'Why']} /> <br />
					<span className="text-secondary">Runner</span>
				</div>
			</div>
			<div className="flex gap-4">
				<Link href="contests">
					<Button variant={'outline'}>{t('buttons.contests')}</Button>
				</Link>
				<Link href="problems">
					<Button variant={'outline'}>{t('buttons.problems')}</Button>
				</Link>
			</div>
		</main>
	);
}
