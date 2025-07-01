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
import { useTheme } from 'next-themes';
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

export function AvatarButton({ session }: { session: Session }) {
	const { setTheme } = useTheme();
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const locale = useLocale();

	function handleLocaleChange(locale: 'br' | 'en') {
		router.replace(pathname, { locale });
	}

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
				<DropdownMenuGroup>
					<Link href={'/profile'}>
						<DropdownMenuItem>
							<User />
							<span>{t('AvatarButton.profile')}</span>
						</DropdownMenuItem>
					</Link>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<Link href={'/teams'}>
						<DropdownMenuItem>
							<Users />
							<span>{t('AvatarButton.problems')}</span>
						</DropdownMenuItem>
					</Link>
					<Link href={'/contests'}>
						<DropdownMenuItem>
							<Trophy />
							<span>{t('AvatarButton.contests')}</span>
						</DropdownMenuItem>
					</Link>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<Link
					href="https://github.com/whowon2/why-runner"
					rel="noopener"
					target="_blank"
				>
					<DropdownMenuItem>
						<Github />
						<span>GitHub</span>
					</DropdownMenuItem>
				</Link>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="gap-2">
						<Palette size={18} color={'gray'} />
						<span>{t('AvatarButton.theme')}</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							<DropdownMenuItem onClick={() => setTheme('light')}>
								<Sun />
								{t('Themes.light')}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setTheme('dark')}>
								<Moon />
								{t('Themes.dark')}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setTheme('system')}>
								<Cog />
								{t('Themes.system')}
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
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
				<DropdownMenuItem disabled={true}>
					<Cloud />
					<span>API</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => signOut()}>
					<LogOut />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
