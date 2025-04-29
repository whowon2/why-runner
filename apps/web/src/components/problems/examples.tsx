export function ProblemExamples({
	inputs,
	outputs,
}: {
	inputs: string[];
	outputs: string[];
}) {
	return (
		<div>
			<h2 className="mb-4 font-semibold text-xl">Examples</h2>
			<div className="space-y-4">
				{inputs.slice(0, 2).map((input, i) => (
					<div
						key={i}
						className="flex justify-between gap-4 rounded-md border bg-white p-4 shadow-sm"
					>
						<div className="w-full">
							<span className="font-medium">Input:</span>
							<pre className="mt-1 rounded bg-gray-100 p-2">{input}</pre>
						</div>
						<div className="w-full">
							<span className="font-medium">Output:</span>
							<pre className="mt-1 rounded bg-gray-100 p-2">{outputs[i]}</pre>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
