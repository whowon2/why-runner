'use client';

import {
	Cloud,
	Github,
	Keyboard,
	LifeBuoy,
	LogOut,
	Settings,
	Trophy,
	User,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/trpc/react';

export function AvatarButton({ session }: { session: Session }) {
	const initials = (session.user.name ?? '')
		.split(' ')
		.map((name) => name[0])
		.join('');

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<Avatar className="cursor-pointer">
					<AvatarImage src={session.user?.image ?? ''} />
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<Link href={'/profile'}>
						<DropdownMenuItem>
							<User />
							<span>Profile</span>
							<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
						</DropdownMenuItem>
					</Link>
					<Link href={'/settings'}>
						<DropdownMenuItem>
							<Settings />
							<span>Settings</span>
							<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
						</DropdownMenuItem>
					</Link>
					<DropdownMenuItem>
						<Keyboard />
						<span>Keyboard shortcuts</span>
						<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<Link href={'/teams'}>
						<DropdownMenuItem>
							<Users />
							<span>Teams</span>
						</DropdownMenuItem>
					</Link>
					<Link href={'/contests'}>
						<DropdownMenuItem>
							<Trophy />
							<span>Contests</span>
						</DropdownMenuItem>
					</Link>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<Link
					href="https://github.com/JuanIWK3/why-runner"
					rel="noopener"
					target="_blank"
				>
					<DropdownMenuItem>
						<Github />
						<span>GitHub</span>
					</DropdownMenuItem>
				</Link>
				<DropdownMenuItem>
					<LifeBuoy />
					<span>Support</span>
				</DropdownMenuItem>
				<DropdownMenuItem disabled={true}>
					<Cloud />
					<span>API</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<Link href="/api/auth/signout">
					<DropdownMenuItem>
						<LogOut />
						<span>Log out</span>
						<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
					</DropdownMenuItem>
				</Link>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
