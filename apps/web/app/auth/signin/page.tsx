import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SigninForm } from "./form";

export default async function SignupPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const callbackUrl = (await searchParams).callbackUrl;

	return (
		<div className="flex min-h-screen justify-center items-center">
			<Card className="w-full max-w-sm">
				<CardHeader>Signup</CardHeader>
				<CardContent>
					<SigninForm callbackUrl={callbackUrl} />
				</CardContent>
			</Card>
		</div>
	);
}
