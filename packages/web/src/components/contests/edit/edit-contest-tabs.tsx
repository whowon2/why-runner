import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Contest } from "@runner/db";
import { DeleteContestDialog } from "../delete/delete-contest-dialog";

export function EditContestTabs({ contest }: { contest: Contest }) {
	return (
		<Tabs defaultValue="data" className="w-full">
			<TabsList>
				<TabsTrigger value="data">Data</TabsTrigger>
				<TabsTrigger value="problems">Problems</TabsTrigger>
				<TabsTrigger value="publish">Publish</TabsTrigger>
				<TabsTrigger value="danger">Danger</TabsTrigger>
			</TabsList>
			<TabsContent value="data">
				<div>Data</div>
			</TabsContent>
			<TabsContent value="problems">
				<div>Problems</div>
			</TabsContent>
			<TabsContent value="publish">
				<div>Publish</div>
			</TabsContent>
			<TabsContent value="danger">
				<DeleteContestDialog contest={contest} />
			</TabsContent>
		</Tabs>
	);
}
