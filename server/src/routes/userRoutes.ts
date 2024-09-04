import { ObjectId } from "@fastify/mongodb";
import { FastifyInstance } from "fastify";
import { findUserByUserId } from "../services/userService.js";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.get("/leaderboard", async (req, res) => {
		const users = fastify.mongo.db!.collection("users");
		try {
			const query = { wins: { $gt: 0 } };
			const projection = { _id: 1, username: 1, wins: 1 };

			const result: any[] = [];
			if ((await users.countDocuments(query)) === 0) {
				res.status(200).send(result);
				return;
			}

			const cursor = users.find(query).sort({ wins: -1 }).project(projection);
			for await (const doc of cursor) {
				result.push(doc);
			}

			fastify.log.info(`Documents found ${result.length}`);
			res.status(200).send(result);
		} catch (error) {
			fastify.log.error(error);
			res.status(500).send(error);
		}
	});

	fastify.patch("/user/:userId/win", async (req, res) => {
		const { userId }: { userId: string } | any = req.params;
		const users = fastify.mongo.db!.collection("users");
		try {
			const user = await findUserByUserId(fastify, userId);
			if (!user) {
				res.status(404);
				return;
			}

			const filter = { _id: new ObjectId(userId) };
			const updateDoc = {
				$set: {
					wins: user.wins + 1,
				},
			};
			const result = await users.updateOne(filter, updateDoc);
			if (result.matchedCount === 1 && result.modifiedCount === 1) {
				fastify.log.info(
					`A document was updated with the _id: ${result.upsertedId}`
				);
				res.status(200).send(result);
				return;
			}

			fastify.log.warn(req.body);
			res.status(500).send(result);
		} catch (error) {
			fastify.log.error(error);
			res.status(500).send(error);
		}
	});
}
