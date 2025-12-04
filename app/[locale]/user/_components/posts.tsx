import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Post = {
  id: string;
  type: "contest" | "submission" | "problem";
  content: string;
};

export function Posts() {
  const posts: Post[] = [
    {
      id: "1",
      type: "contest",
      content: "I got 1st place at the contest",
    },
    {
      id: "2",
      type: "submission",
      content: "Check my submission at the #123 problem",
    },
    {
      id: "3",
      type: "problem",
      content: "I made this problem challenging you binary tree skills",
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <CardTitle>{post.type}</CardTitle>
          </CardHeader>
          <CardContent>{post.content}</CardContent>
        </Card>
      ))}
    </div>
  );
}
