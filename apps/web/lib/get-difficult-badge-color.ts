export function getBadgeColor(difficulty: string) {
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
