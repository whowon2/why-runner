import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "lucide-react";

export default async function ProblemsPage() {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Problems</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Link href="/problems/1">Problem 1</Link>
            <Link href="/problems/2">Problem 2</Link>
            <Link href="/problems/3">Problem 3</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
