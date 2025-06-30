import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations("HomePage")

	return (
		<main className="flex flex-col items-center justify-center">
			<div className="flex flex-col items-center justify-center px-4 py-16">
				<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
					<span className="text-secondary">Why</span>Runner
				</h1>
			</div>
			<div className="flex gap-4">
				<Link href="contests">
					<Button className="cursor-pointer" variant={'outline'}>
            {t('buttons.contests')}
					</Button>
				</Link>
				<Link href="problems">
					<Button className="cursor-pointer" variant={'outline'}>
  					Problems
					</Button>
				</Link>
			</div>
		</main>
	);
}
