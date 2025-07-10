'use client';

import { useTranslations } from 'next-intl';
import { Safari } from '@/components/magicui/safari';
import { Button } from '@/components/ui/button';
import { FlipWords } from '@/components/ui/flip-words';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/i18n/navigation';

export default function Home() {
	const t = useTranslations('HomePage');

	return (
		<main className="flex flex-col items-center justify-center flex-1 p-8 gap-12">
			{/* Hero */}
			<div className="flex flex-col items-center justify-center px-4 h-screen">
				<div className="flex font-extrabold text-6xl tracking-tight sm:text-[5rem]">
					<FlipWords words={['Uai', 'Why']} /> <br />
					<span className="text-secondary">Runner</span>
				</div>

				{/* Navigation Buttons */}
				<div className="flex gap-4 mb-24 mt-12">
					<Link href="contests">
						<Button variant={'outline'}>{t('buttons.contests')}</Button>
					</Link>
					<Link href="problems">
						<Button variant={'outline'}>{t('buttons.problems')}</Button>
					</Link>
				</div>
			</div>

			{/* Safari Preview */}
			<section className="max-w-4xl text-center mt-32 space-y-4 h-[60vh]">
				<h2 className="text-3xl font-bold tracking-tight">
					Live Submission Interface
				</h2>
				<p className="text-muted-foreground text-sm">
					A real-time environment for solving problems, submitting code, and
					receiving feedback.
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

			<Separator />

			{/* Features */}
			<section className="max-w-4xl text-center my-32 space-y-12">
				<h2 className="text-3xl font-bold tracking-tight">
					What makes it different?
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
					<div className="p-4 rounded-xl border shadow-sm">
						<h3 className="text-xl font-semibold">🔒 Safe Execution</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Submissions run in isolated environments with time and memory
							limits.
						</p>
					</div>
					<div className="p-4 rounded-xl border shadow-sm">
						<h3 className="text-xl font-semibold">📩 AI Feedback</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Failed submissions get vague, human-like hints powered by Gemini.
						</p>
					</div>
					<div className="p-4 rounded-xl border shadow-sm">
						<h3 className="text-xl font-semibold">⚡ Real-Time Contests</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Live scoreboard, problem announcements, and student analytics.
						</p>
					</div>
				</div>
			</section>

			<Separator />

			{/* How It Works */}
			<section className="max-w-4xl text-center my-32 space-y-12 bg-">
				<h2 className="text-3xl font-bold tracking-tight">How it works</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">1. Submit Code</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Students solve problems and submit code directly from the web
							interface.
						</p>
					</div>
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">2. Isolated Execution</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Code runs inside a judge container with language-specific scripts
							and safety checks.
						</p>
					</div>
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">3. Get Results + AI Hints</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Results are displayed instantly, with optional AI hints for
							debugging and improvement.
						</p>
					</div>
				</div>
			</section>

			<Separator />

			{/* Use Cases */}
			<section className="max-w-4xl text-center my-32 space-y-12">
				<h2 className="text-3xl font-bold tracking-tight">
					Designed for real classrooms
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">👨‍🏫 Instructors</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Create contests, manage problems, and track student progress.
						</p>
					</div>
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">👩‍🎓 Students</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Practice problems, compete in contests, and receive smart
							feedback.
						</p>
					</div>
					<div className="p-4 rounded-xl border">
						<h3 className="text-xl font-semibold">🏁 Contests</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Live scoreboard, time limits, and multilingual problem support.
						</p>
					</div>
				</div>
			</section>

			<Separator />

			{/* Tech Stack */}
			<section className="max-w-4xl text-center my-32 mb-40 space-y-6">
				<h2 className="text-3xl font-bold tracking-tight">
					Built with modern tools
				</h2>
				<p className="text-muted-foreground text-sm">
					The architecture combines performance, safety, and developer
					experience.
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
