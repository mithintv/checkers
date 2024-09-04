import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ISocketGame } from "@shared/interfaces";

export default function LobbyList({ lobby }: { lobby: ISocketGame[] }) {
	return (
		<>
			<div>
				<h4 className="mb-4 scroll-m-20 text-xl font-semibold tracking-tight">
					Game Lobby
				</h4>
				<Table>
					<TableCaption>
						{lobby.length === 1 && "Waiting for a second player..."}
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Username</TableHead>
							<TableHead>Position</TableHead>
							<TableHead className="text-right">Highscore</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{lobby.map((p) => (
							<TableRow key={p.userId}>
								<TableCell className="font-medium">{p.username}</TableCell>
								<TableCell className="font-medium">{p.position}</TableCell>
								<TableCell className="text-right">{p.userId}</TableCell>
							</TableRow>
						))}
					</TableBody>
					{/* <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter> */}
				</Table>
			</div>
		</>
	);
}
