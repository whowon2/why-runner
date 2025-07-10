'use client';

import { useTranslations } from 'next-intl';
import { Safari } from '@/components/magicui/safari';
import { Button } from '@/components/ui/button';
import { FlipWords } from '@/components/ui/flip-words';
import { Link } from '@/i18n/navigation';
import { ArrowDown } from 'lucide-react';

export default function Home() {
	const t = useTranslations('HomePage');

	return (
		<main className="flex flex-col items-center justify-center flex-1 p-8 gap-12">
			{/* Hero */}
			<div className="flex flex-col items-center justify-center px-4 h-screen -mb-60">
				<div className="flex font-extrabold text-5xl tracking-tight sm:text-[5rem]">
					<FlipWords words={['Uai', 'Why']} /> <br />
					<span className="text-secondary">Runner</span>
				</div>
				{/* Navigation Buttons */}
				<div className="flex gap-4 mt-12">
					<Link href="contests">
						<Button variant={'outline'}>{t('buttons.contests')}</Button>
					</Link>
					<Link href="problems">
						<Button variant={'outline'}>{t('buttons.problems')}</Button>
					</Link>
				</div>
			</div>

			<a href="#example">
  			<ArrowDown className='animate-bounce mb-40'/>
			</a>

			{/* Safari Preview */}
			<section className="max-w-4xl text-center mt-32 space-y-4" id="example">
				<h2 className="text-3xl font-bold tracking-tight">
					{t('landing.submission.title')}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t('landing.submission.description')}
				</p>

				<div className="relative w-full max-w-5xl mt-12">
					<Safari
						url="why-runner.vercel.app"
						mode="simple"
						className="size-full"
						imageSrc="https://sysdty3yzpahzaza.public.blob.vercel-storage.com/example.png"
					/>
				</div>
			</section>

			{/* Features */}
			<section className="max-w-4xl text-center mt-32 space-y-12">
				<h2 className="text-3xl font-bold tracking-tight">
					{t('landing.features.title')}
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
					<div className="p-4 rounded-xl border shadow-sm">
						<h3 className="text-xl font-semibold">
							🔒 {t('landing.features.safe.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.features.safe.description')}
						</p>
					</div>
					<div className="p-4 rounded-xl border shadow-sm">
						<h3 className="text-xl font-semibold">
							📩 {t('landing.features.ai.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.features.ai.description')}
						</p>
					</div>
					<div className="p-4 rounded-xl border shadow-sm">
						<h3 className="text-xl font-semibold">
							⚡ {t('landing.features.realtime.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.features.realtime.description')}
						</p>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="max-w-4xl text-center mt-32 space-y-12">
				<h2 className="text-3xl font-bold tracking-tight">
					{t('landing.how.title')}
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">
							1. {t('landing.how.step1.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.how.step1.description')}
						</p>
					</div>
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">
							2. {t('landing.how.step2.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.how.step2.description')}
						</p>
					</div>
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">
							3. {t('landing.how.step3.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.how.step3.description')}
						</p>
					</div>
				</div>
			</section>

			{/* Use Cases */}
			<section className="max-w-4xl text-center mt-32 space-y-12">
				<h2 className="text-3xl font-bold tracking-tight">
					{t('landing.usecases.title')}
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">
							👨‍🏫 {t('landing.usecases.instructors.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.usecases.instructors.description')}
						</p>
					</div>
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">
							👩‍🎓 {t('landing.usecases.students.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.usecases.students.description')}
						</p>
					</div>
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">
							🏁 {t('landing.usecases.contests.title')}
						</h3>
						<p className="text-sm text-muted-foreground mt-2">
							{t('landing.usecases.contests.description')}
						</p>
					</div>
				</div>
			</section>

			{/* Tech Stack */}
			<section className="max-w-4xl text-center mt-32 mb-40 space-y-6">
				<h2 className="text-3xl font-bold tracking-tight">
					{t('landing.stack.title')}
				</h2>
				<p className="text-muted-foreground text-sm">
					{t('landing.stack.description')}
				</p>
				<div className="flex flex-wrap justify-center gap-4 text-muted-foreground text-sm">
					<span>Next.js</span>
					<span>tRPC</span>
					<span>Prisma</span>
					<span>PostgreSQL</span>
					<span>AWS SQS</span>
					<span>Bun</span>
					<span>Docker</span>
					<span>Gemini API</span>
					<span>NX Monorepo</span>
				</div>
			</section>
		</main>
	);
}
