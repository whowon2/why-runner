export function getAwardColor(idx: number) {
  const colors = [
    "green",
    "blue",
    "purple",
    "orange",
    "pink",
    "cyan",
    "magenta",
    "lime",
    "teal",
    "indigo",
    "violet",
    "gray",
    "yellow",
    "red",
  ];
  return colors[idx % colors.length];
}
