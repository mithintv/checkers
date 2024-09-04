import { IGameState } from "@shared/interfaces";
import { FastifyInstance } from "fastify";

export default async function gameRoutes(fastify: FastifyInstance) {

	fastify.get("/games/:userId", async (req, res) => {
		const { userId }: { userId: string } | any = req.params;
		const games = fastify.mongo.db!.collection("games");
		try {
			const cursor = games.find(
				{
					userId: userId,
				},
				{
					sort: {
						timestamp: -1,
					},
				}
			);
			const result = [];
			for await (const doc of cursor) {
				result.push(doc);
			}
			fastify.log.info(`Documents found: ${result.length}`);
			res.status(200).send(result);
		} catch (error) {
			fastify.log.error(error);
			res.status(500).send(error);
		}
	});

	fastify.post("/game", async (req, res) => {
		fastify.log.info(req.body);
		const {
			userId,
			gameId,
			name,
			timestamp,
			gameState,
		}:
			| {
					userId: string;
					gameId: string;
					name: string;
					timestamp: string;
					gameState: IGameState;
			  }
			| any = req.body;
		const games = fastify.mongo.db!.collection("games");
		try {
			const game = await games.findOne({
				_id: gameId,
			});
			if (!game) {
				const result = await games.insertOne({
					_id: gameId,
					userId,
					name,
					timestamp,
					gameState,
				});
				fastify.log.info(
					`A document was inserted with the _id: ${result.insertedId}`
				);
				res.status(200).send(result);
				return;
			}

			const filter = {
				_id: gameId,
			};
			const update = {
				$set: {
					userId,
					name,
					timestamp,
					gameState,
				},
			};
			const result = await games.updateOne(filter, update);
			if (result.matchedCount === 1 && result.modifiedCount === 1) {
				fastify.log.info(`A document was updated with the _id: ${gameId}`);
			}
			res.status(200).send(result);
		} catch (error) {
			fastify.log.error(error);
			res.status(500).send(error);
		}
	});

	fastify.get("/game/:gameId", async (req, res) => {
		const { gameId }: { gameId: string } | any = req.params;
		const games = fastify.mongo.db!.collection("games");
		try {
			const result = await games.findOne({
				_id: gameId,
			});
			fastify.log.info(`A document was found with the _id: ${result?._id}`);
			res.status(200).send(result);
		} catch (error) {
			fastify.log.error(error);
			res.status(500).send(error);
		}
	});

	fastify.delete("/game/:gameId", async (req, res) => {
		const { gameId }: { gameId: string } | any = req.params;
		const games = fastify.mongo.db!.collection("games");
		try {
			const result = await games.deleteOne({
				_id: gameId,
			});
			if (result.deletedCount === 1) {
				fastify.log.info(`Deleted Document: ${result?.acknowledged}`);
				res.status(200).send(result);
				return;
			}

			res.status(500).send(result);
		} catch (error) {
			fastify.log.error(error);
			res.status(500).send(error);
		}
  });
  
}
