import { redirect } from 'next/navigation';
import { BreadCrumbs } from '@/components/breadcrumbs';
import Profile from '@/components/profile';
import { auth } from '@/server/auth';
import { HydrateClient } from '@/trpc/server';

export default async function ProfilePage() {
	const session = await auth();

	if (!session) {
		redirect('/auth/signin?callbackUrl=profile');
	}

	return (
		<HydrateClient>
			<div className="flex w-full flex-col items-center justify-center p-4">
				<BreadCrumbs />
				<Profile />
			</div>
		</HydrateClient>
	);
}
