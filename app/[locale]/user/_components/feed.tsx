import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Feed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contest</CardTitle>
        <CardDescription>Do you have brio 2024</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        Got 1st place on the contest. It was a tough one.
      </CardContent>
      <CardFooter>
        {/*Comments*/}
        <div>asdf</div>
      </CardFooter>
    </Card>
  );
}
