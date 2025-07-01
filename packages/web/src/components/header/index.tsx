import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { auth } from '@/server/auth';
import { AvatarButton } from './avatar-button';

export async function Header() {
	const session = await auth();

	return (
		<div className="sticky flex items-center justify-between border-b p-4">
			<div className="flex gap-2">
				<Link href={'/'}>
					<span className="font-bold">WhyRunner</span>
				</Link>
			</div>
			<div>
				{session ? (
					<AvatarButton session={session} />
				) : (
					<a href={'/api/auth/signin'}>
						<Button>Login</Button>
					</a>
				)}
			</div>
		</div>
	);
}
