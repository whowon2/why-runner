export function ProblemExamples({
	inputs,
	outputs,
}: {
	inputs: string[];
	outputs: string[];
}) {
	return (
		<div className="space-y-4">
			{inputs.slice(0, 2).map((input, i) => (
				<div key={`${i}-${input}`} className="flex gap-4">
					<div className="w-full">
						<span className="font-medium">Input:</span>
						<pre className="mt-1 rounded border p-2">{input}</pre>
					</div>
					<div className="w-full">
						<span className="font-medium">Output:</span>
						<pre className="mt-1 rounded border p-2">{outputs[i]}</pre>
					</div>
				</div>
			))}
		</div>
	);
}
