import { useTranslations } from 'next-intl';

export function ProblemExamples({
	inputs,
	outputs,
}: {
	inputs: string[];
	outputs: string[];
}) {
	const t = useTranslations('ContestsPage.Tabs.Problem.Examples');
	return (
		<div className="space-y-4">
			{inputs.slice(0, 2).map((input, i) => (
				<div className="flex gap-4" key={`${i}-${input}`}>
					<div className="w-full">
						<span className="font-medium">{t('input')}:</span>
						<pre className="mt-1 rounded border p-2">{input}</pre>
					</div>
					<div className="w-full">
						<span className="font-medium">{t('output')}:</span>
						<pre className="mt-1 rounded border p-2">{outputs[i]}</pre>
					</div>
				</div>
			))}
		</div>
	);
}
