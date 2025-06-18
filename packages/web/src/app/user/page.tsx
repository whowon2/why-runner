import { redirect } from 'next/navigation';
import { BreadCrumbs } from '@/components/breadcrumbs';
import { auth } from '@/server/auth';
import Profile from '../../components/profile';

export default async function ProfilePage() {
	const session = await auth();

	if (!session) {
		redirect('/auth/signin?callbackUrl=profile');
	}

	return (
		<div className="flex w-full flex-col items-center justify-center p-4">
			<BreadCrumbs />
			<Profile session={session} />
		</div>
	);
}
