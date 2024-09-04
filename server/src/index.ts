import cors from "@fastify/cors";
import mongodb, { ObjectId } from "@fastify/mongodb";
import passport from "@fastify/passport";
import secureSession from "@fastify/secure-session";
import { IGameState, ISocketUsers } from "@shared/interfaces.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Fastify from "fastify";
import passportLocal from "passport-local";
import { Server } from "socket.io";

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
fastify.register(cors, {
	origin: ["http://localhost:5173"], // Allow requests from this origin
	methods: ["GET", "POST", "DELETE"],
});

fastify.register(secureSession, {
	key: Buffer.from(process.env.SECRET_KEY!, "hex"),
});
fastify.register(passport.initialize());
fastify.register(passport.secureSession());

passport.use(
	"local",
	new passportLocal.Strategy(async (username, password, done) => {
		const user = await findUserByUsername(username);
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return done(null, false, { message: "Incorrect username or password!" });
		}
		return done(null, {
			_id: user._id,
			username: user.username,
			wins: user.wins,
		});
	})
);
passport.registerUserSerializer(
	async (user: { _id: string }, request) => user._id
);
passport.registerUserDeserializer(async (username: string, request) => {
	return await findUserByUsername(username);
});

const io = new Server(fastify.server, {
	path: "/lobby",
	cors: {
		origin: ["https://admin.socket.io", "http://localhost:5173"], // Allow requests from this origin
		methods: ["GET", "POST"],
		allowedHeaders: ["Content-Type"],
		credentials: true,
	},
});
// instrument(io, {
// 	namespaceName: "/admin",
// 	auth: false,
// 	mode: "development",
// });

// Handle connection events
const currentUsers: ISocketUsers = {};
io.on("connection", (socket) => {
	log.info(`Socket connected: ${socket.id}`);

	// Handle joining a game room
	socket.on("joinGame", ({ userId, username, gameId }) => {
		socket.join(gameId);
		log.info(`User ${userId} joined game: ${gameId} on socket: ${socket.id}`);

		// Broadcast the list of users and their custom data to the room
		if (!currentUsers[gameId]) {
			currentUsers[gameId] = [];
		}
		const curr = currentUsers[gameId].find((x) => x.socketId === socket.id);
		if (curr) {
			curr.userId = userId;
		} else {
			currentUsers[gameId].push({
				userId,
				username,
				socketId: socket.id,
				position: currentUsers[gameId].length > 0 ? "black" : "red",
			});
		}

		io.to(gameId).emit("currentUsers", currentUsers);
	});

	// Handle updating game state
	socket.on("changeState", ({ userId, gameId, gameState }) => {
		log.info(`Game ${gameId} updated by ${userId} [${socket.id}]`);
		socket.broadcast.emit("stateChanged", { userId, gameId, gameState });
	});

	// Handle disconnection
	socket.on("disconnect", () => {
		log.info(`Socket disconnected: ${socket.id}`);
		for (const key in currentUsers) {
			currentUsers[key] = currentUsers[key].filter(
				(x) => x.socketId !== socket.id
			);
		}
	});
});

fastify.post("/register", async (req, res) => {
	const { username, password }: { username: string; password: string } | any =
		req.body;
	const db = fastify.mongo.db!.collection("users");
	try {
		const exists = await db.findOne({
			username,
		});
		if (exists) throw new Error("username already exists!");

		const result = await db.insertOne({
			username,
			password: await hashPassword(password),
			wins: 0,
		});
		log.info(`A document was inserted with the _id: ${result.insertedId}`);
		res.status(200).send(result.insertedId);
	} catch (error) {
		log.error(error);
	}
});

fastify.post(
	"/login",
	{ preValidation: passport.authenticate("local") },
	async (req, res) => {
		res.status(200).send(req.user);
	}
);

fastify.get("/logout", async (req, res) => {
	await req.logout();
	req.session.delete();
	res.clearCookie("session").send({ message: "Logged out successfully" });
});

fastify.get("/games", async (req, res) => {
	const games = fastify.mongo.db!.collection("games");
	try {
		const cursor = games.find();
		log.info(`Documents found: ${await games.countDocuments()}`);
		const result = [];
		for await (const doc of cursor) {
			result.push(doc);
		}
		res.status(200).send(result);
	} catch (error) {
		log.error(error);
	}
});

fastify.post("/game", async (req, res) => {
	log.info(req.body);
	const {
		gameId,
		name,
		timestamp,
		gameState,
	}: { gameState: IGameState } | any = req.body;
	const games = fastify.mongo.db!.collection("games");
	try {
		const game = await games.findOne({
			_id: gameId,
		});
		if (!game) {
			const result = await games.insertOne({
				_id: gameId,
				name,
				timestamp,
				gameState,
			});
			log.info(`A document was inserted with the _id: ${result.insertedId}`);
			res.status(200).send(result);
		}

		const filter = {
			_id: gameId,
		};
		const update = {
			$set: {
				name,
				timestamp,
				gameState,
			},
		};
		const result = await games.updateOne(filter, update);
		if (result.matchedCount === 1 && result.modifiedCount === 1) {
			log.info(`A document was updated with the _id: ${gameId}`);
			res.status(200).send(result);
		}
		res.status(200).send(result);
	} catch (error) {
		log.error(error);
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
		log.info(`A document was found with the _id: ${result?._id}`);
		res.status(200).send(result);
	} catch (error) {
		log.error(error);
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
			log.info(`Deleted Document: ${result?.acknowledged}`);
			res.status(200).send(result);
		}

		res.status(500).send(result);
	} catch (error) {
		log.error(error);
		res.status(500).send(error);
	}
});

fastify.get("/leaderboard", async (req, res) => {
	const users = fastify.mongo.db!.collection("users");
	try {
		const query = { wins: { $gt: 0 } };
		const projection = { _id: 1, username: 1, wins: 1 };

		const result: any[] = [];
		if ((await users.countDocuments(query)) === 0) {
			res.status(200).send(result);
		}

		const cursor = users.find(query).sort({ wins: -1 }).project(projection);
		for await (const doc of cursor) {
			result.push(doc);
		}

		log.info(`Documents found ${result.length}`);
		res.status(200).send(result);
	} catch (error) {
		log.error(error);
		res.status(500).send(error);
	}
});

fastify.patch("/user", async (req, res) => {
	const { _id, wins }: { _id: string; wins: number } | any = req.body;
	const users = fastify.mongo.db!.collection("users");
	try {
		const filter = { _id: new ObjectId(_id) };
		const updateDoc = {
			$set: {
				wins: wins,
			},
		};
		const result = await users.updateOne(filter, updateDoc);
		if (result.matchedCount === 1 && result.modifiedCount === 1) {
			log.info(`A document was updated with the _id: ${result.upsertedId}`);
			res.status(200).send(result);
		}
		log.error(req.body);
		res.status(500).send(result);
	} catch (error) {
		log.error(error);
		res.status(500).send(error);
	}
});

fastify.listen({ port: 5041 }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
});

/**
 * Find user by username
 * @param username
 * @param password
 * @returns user
 */
const findUserByUsername = async (username: string) => {
	const collection = fastify.mongo.db!.collection("users");
	const user = await collection.findOne({
		username,
	});
	return user;
};

/**
 * Hash password
 * @param password
 * @returns hash
 */
async function hashPassword(password: string) {
	const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS!));
	return await bcrypt.hash(password, salt);
}
