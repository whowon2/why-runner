import { Problem } from "@repo/db";

export function ProblemsList({ problems }: { problems: Problem[] }) {
  return (
    <div>
      <h1>Problems List</h1>
      <ul>
        {problems.map((problem) => (
          <li key={problem.id}>{problem.title}</li>
        ))}
      </ul>
    </div>
  );
}
