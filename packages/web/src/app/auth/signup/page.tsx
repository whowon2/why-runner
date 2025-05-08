import { SignupForm } from "./form";

export default async function Signup({
	searchParams,
}: {
	searchParams: Promise<{ callbackUrl: string }>;
}) {
	const { callbackUrl } = (await searchParams) ?? "";

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<SignupForm callbackUrl={callbackUrl} />
			</div>
		</div>
	);
}
