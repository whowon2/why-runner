import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/copy-button";

export function ProblemExamples({
  inputs,
  outputs,
}: {
  inputs: string[];
  outputs: string[];
}) {
  const t = useTranslations("ContestsPage.Tabs.Problem.Examples");
  return (
    <div className="space-y-4">
      {inputs.slice(0, 2).map((input, i) => (
        <div className="flex gap-4" key={`${i}-${input}`}>
          <div className="min-w-0 w-full">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("input")}:</span>
              <CopyButton value={input} />
            </div>
            <pre className="mt-1 overflow-x-auto rounded-none border p-2">
              {input}
            </pre>
          </div>
          <div className="min-w-0 w-full">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("output")}:</span>
              <CopyButton value={outputs[i]} />
            </div>
            <pre className="mt-1 overflow-x-auto rounded-none border p-2">
              {outputs[i]}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
