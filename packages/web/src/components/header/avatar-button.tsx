'use client';

import {
	Check,
	Cloud,
	Cog,
	Github,
	Globe,
	LogOut,
	Moon,
	Palette,
	Sun,
	Trophy,
	User,
	Users,
} from 'lucide-react';
import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePathname, useRouter } from '@/i18n/navigation';

export function AvatarButton({ session }: { session: Session | null }) {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const locale = useLocale();

	function handleLocaleChange(locale: 'br' | 'en') {
		router.replace(pathname, { locale });
	}

	const initials = (session?.user.name ?? '')
		.split(' ')
		.map((name) => name[0])
		.join('');

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<Avatar className="cursor-pointer">
					<AvatarImage src={session?.user?.image ?? ''} />
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuGroup>
					<Link href={'/user'}>
						<DropdownMenuItem>
							<User />
							<span>{t('AvatarButton.profile')}</span>
						</DropdownMenuItem>
					</Link>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="gap-2">
						<Globe size={18} color={'gray'} />
						<span>{t('Languages.placeholder')}</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							<DropdownMenuItem onClick={() => handleLocaleChange('br')}>
								{locale === 'br' && <Check />}
								{t('Languages.portuguese')}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleLocaleChange('en')}>
								{locale === 'en' && <Check />}
								{t('Languages.english')}
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => signOut()}>
					<LogOut />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
