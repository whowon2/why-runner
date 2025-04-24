import { Badge } from "@/components/ui/badge";
import { getColor } from "@/lib/get-difficulty-badge-color";

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
	return <Badge className={getColor(difficulty)}>{difficulty}</Badge>;
}
