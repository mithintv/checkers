import { api } from "@/lib/constants";
import { IUser } from "@shared/interfaces";
import { useEffect, useState } from "react";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";

export default function Leaderboard() {
	const [leaderboard, setLeaderboard] = useState<IUser[]>([]);

	useEffect(() => {
		(async function () {
			const res = await fetch(`${api}/leaderboard`, {
				method: "GET",
			});
			const json = await res.json();
			console.log(json);
			setLeaderboard(json);
		})();
	}, []);

	return (
		<div className="my-8">
			<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
				Leaderboard
			</h4>
			<Table>
				<TableCaption>Highscores</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[100px]">Username</TableHead>
						<TableHead className="text-right">Wins</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{leaderboard.map((p) => (
						<TableRow key={p._id}>
							<TableCell className="font-medium text-left">
								{p.username}
							</TableCell>
							<TableCell className="text-right">{p.wins}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
