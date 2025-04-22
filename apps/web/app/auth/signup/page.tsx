import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "./form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const redirectUrl = (await searchParams).redirectUrl;

  return (
    <div className="flex min-h-screen justify-center items-center">
      <Card className="w-full max-w-sm">
        <CardHeader>Signup</CardHeader>
        <CardContent>
          <SignupForm redirectUrl={redirectUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
