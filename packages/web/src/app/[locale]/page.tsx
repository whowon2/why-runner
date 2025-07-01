import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function Home() {
	const t = useTranslations('HomePage');

	return (
		<main className="flex flex-col items-center justify-center">
			<div className="flex flex-col items-center justify-center px-4 py-16">
				<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
					<span className="text-secondary">Why</span>Runner
				</h1>
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
