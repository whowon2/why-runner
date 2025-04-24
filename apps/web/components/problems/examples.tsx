export function ProblemExamples({
  inputs,
  outputs,
}: { inputs: string[]; outputs: string[] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Examples</h2>
      <div className="space-y-4">
        {inputs.slice(0, 2).map((input, i) => (
          <div
            key={i}
            className="flex gap-4 justify-between border rounded-md p-4 bg-white shadow-sm"
          >
            <div className="w-full">
              <span className="font-medium">Input:</span>
              <pre className="bg-gray-100 p-2 rounded mt-1">{input}</pre>
            </div>
            <div className="w-full">
              <span className="font-medium">Output:</span>
              <pre className="bg-gray-100 p-2 rounded mt-1">{outputs[i]}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
