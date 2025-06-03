import { Badge } from "@/components/ui/badge";

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
	return <Badge className={getColor(difficulty)}>{difficulty}</Badge>;
}

function getColor(difficulty: string) {
	switch (difficulty.toLocaleLowerCase()) {
		case "easy":
			return "bg-green-400";
		case "medium":
			return "bg-orange-400";
		case "hard":
			return "bg-red-400";
		default:
			return "bg-gray-400";
	}
}
