import { api } from "@/lib/constants";
import { IGameSave } from "@shared/interfaces";
import { useEffect, useState } from "react";
import { MdOutlineDelete } from "react-icons/md";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function GameList({
	userId,
	onLoad,
	onSave,
	onDelete,
}: {
	userId: string;
	onLoad: (id: string) => void;
	onSave: (name: string) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
}) {
	const [games, setGames] = useState<IGameSave[]>([]);
	const [tab, setTab] = useState("load");
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");

	useEffect(() => {
		listGames();
	}, []);

	const listGames = async () => {
		console.log("getting games");
		const res = await fetch(`${api}/games/${userId}`, {
			method: "GET",
		});
		const json = await res.json();
		console.log(json);
		setGames(json);
	};

	const deleteGame = async (e: React.MouseEvent, gameId: string) => {
		e.stopPropagation();
		await onDelete(gameId);
		await listGames();
	};

	return (
		<Dialog open={open} onOpenChange={() => setOpen((o) => !o)}>
			<DialogTrigger asChild>
				<Button>Load/Save</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{tab === "load" ? "Load Game" : "Save Game"}
					</DialogTitle>
					<DialogDescription>
						{tab === "load"
							? "Select a game to load."
							: "Save your current game."}
					</DialogDescription>
				</DialogHeader>
				<Tabs
					defaultValue="load"
					onValueChange={(e) => {
						setTab(e);
					}}
					className="grid grid-cols-1"
				>
					<TabsList>
						<TabsTrigger className="w-full" value="load">
							Load
						</TabsTrigger>
						<TabsTrigger
							onClick={() => setTab("save")}
							className="w-full"
							value="save"
						>
							Save
						</TabsTrigger>
					</TabsList>
					<TabsContent value="load">
						<Table>
							<TableCaption>
								Saved Games
								<br />
								*(Red - Black)
							</TableCaption>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead className="text-right">Score*</TableHead>
									<TableHead className="text-right">Date Created</TableHead>
									<TableHead className="text-right"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{games.map((g) => (
									<TableRow
										key={g._id}
										onClick={() => {
											onLoad(g._id);
											setOpen((o) => !o);
										}}
									>
										<TableCell className="font-medium">{g.name}</TableCell>
										<TableCell className="font-medium text-right">
											{g.gameState.score.red} - {g.gameState.score.black}
										</TableCell>
										<TableCell className="text-right">
											{new Date(g.timestamp).toLocaleString()}
										</TableCell>
										<TableCell className="text-right">
											<MdOutlineDelete
												className="fill-rose-800 cursor-pointer"
												size="1.33rem"
												onClick={(e) => deleteGame(e, g._id)}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TabsContent>
					<TabsContent value="save">
						<div className="my-4 grid grid-cols-4 gap-4">
							<Input
								className="col-span-3"
								onChange={(e) => setName(e.target.value)}
								type="text"
								placeholder="Save name"
							/>
							<Button
								className="col-span-1"
								onClick={async () => {
									await onSave(name);
									await listGames();
									setOpen((o) => !o);
								}}
							>
								Save Game
							</Button>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
