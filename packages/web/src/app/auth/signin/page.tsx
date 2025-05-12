import { SigninForm } from "./form";

export default async function Signin({
	searchParams,
}: {
	searchParams: Promise<{ callbackUrl: string }>;
}) {
	const { callbackUrl } = await searchParams;

	console.log(callbackUrl);

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<SigninForm callbackUrl={callbackUrl ?? "/"} />
			</div>
		</div>
	);
}
