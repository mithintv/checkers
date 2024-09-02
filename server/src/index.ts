import mongodb, { ObjectId } from "@fastify/mongodb";
import ws from "@fastify/websocket";
import { IGameState } from "@shared/interfaces.js";
import dotenv from "dotenv";
import Fastify from "fastify";

dotenv.config();

const env = process.env.ENV as "development" | "production" | "test";
const envToLogger = {
	development: {
		transport: {
			target: "pino-pretty",
			options: {
				translateTime: "HH:MM:ss Z",
				ignore: "pid,hostname",
			},
		},
	},
	production: true,
	test: false,
};

const fastify = Fastify({
	logger: envToLogger[env] ?? true,
});
const { log } = fastify;

fastify.register(mongodb, {
	forceClose: true,
	url: process.env.DB_URI!,
	database: "checkers",
});
fastify.register(ws);

fastify.get("/", { websocket: true }, (socket, req) => {
	socket.on("message", (message) => {
		socket.send("hi from server");
	});
});

fastify.get("/games", async (req, reply) => {
	const collection = fastify.mongo.db!.collection("games");
	try {
		const cursor = collection.find();
		log.info(`Documents found: ${await collection.countDocuments()}`);
		const res = [];
		for await (const doc of cursor) {
			res.push(doc);
		}
		reply.status(200).send(res);
	} catch (error) {
		log.error(error);
	}
});

fastify.get("/game/:id", async (req, reply) => {
	const { id }: { id: string } | any = req.params;
	const db = fastify.mongo.db!.collection("games");
	try {
		const result = await db.findOne({
			_id: new ObjectId(id),
		});
		log.info(`A document was found with the _id: ${result?._id}`);
		reply.status(200).send(result);
	} catch (error) {
		log.error(error);
	}
});

fastify.post("/game", async (req, reply) => {
	const { gameState }: { gameState: IGameState } | any = req.body;
	const db = fastify.mongo.db!.collection("games");
	try {
		const result = await db.insertOne({
			gameState,
		});
		log.info(`A document was inserted with the _id: ${result.insertedId}`);
		reply.status(200).send(result.insertedId);
	} catch (error) {
		log.error(error);
	}
});

fastify.listen({ port: 5041 }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
});
