import { useTranslations } from 'next-intl';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export function LanguageSelect() {
	const t = useTranslations('Languages');

	return (
		<Select>
			<SelectTrigger className="border-none">
				<SelectValue placeholder={t('placeholder')} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="br">{t('portuguese')}</SelectItem>
				<SelectItem value="en">{t('english')}</SelectItem>
			</SelectContent>
		</Select>
	);
}
