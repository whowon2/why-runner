'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/trpc/react';
import { CreateContestForm } from './form';

export function CreateContestDialog() {
	const [isOpen, setIsOpen] = useState(false);
	const utils = api.useUtils();
	const t = useTranslations('ContestsPage.createDialog');

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild={true}>
				<Button variant="outline">{t('button')}</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t('title')}</DialogTitle>
				</DialogHeader>
				<CreateContestForm
					onSuccessAction={() => {
						setIsOpen(false);
						utils.contest.findAll.invalidate();
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}
