import cors from "@fastify/cors";
import mongodb from "@fastify/mongodb";
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
		return done(null, { _id: user._id, username: user.username });
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

	// Handle events here, e.g., joining a game room
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
			});
		}

		io.to(gameId).emit("playerJoined", { userId });
		io.to(gameId).emit("currentUsers", currentUsers);
	});

	socket.on("changeState", ({ userId, gameId, gameState }) => {
		log.info("Grid State changed!");
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

fastify.post("/register", async (req, reply) => {
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
		});
		log.info(`A document was inserted with the _id: ${result.insertedId}`);
		reply.status(200).send(result.insertedId);
	} catch (error) {
		log.error(error);
	}
});

fastify.post(
	"/login",
	{ preValidation: passport.authenticate("local") },
	async (req, reply) => {
		reply.status(200).send(req.user);
	}
);

fastify.get("/logout", async (request, reply) => {
	await request.logout();
	request.session.delete();
	reply.clearCookie("session").send({ message: "Logged out successfully" });
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

fastify.post("/game", async (req, reply) => {
	const { gameId, gameState }: { gameState: IGameState } | any = req.body;
	const db = fastify.mongo.db!.collection("games");
	try {
		const result = await db.insertOne({
			_id: gameId,
			gameState,
		});
		log.info(`A document was inserted with the _id: ${result.insertedId}`);
		reply.status(200).send(result.insertedId);
	} catch (error) {
		log.error(error);
	}
});

fastify.get("/game/:gameId", async (req, reply) => {
	const { gameId }: { id: string } | any = req.params;
	const db = fastify.mongo.db!.collection("games");
	try {
		const result = await db.findOne({
			_id: gameId,
		});
		log.info(`A document was found with the _id: ${result?._id}`);
		reply.status(200).send(result);
	} catch (error) {
		log.error(error);
	}
});

fastify.delete("/game/:id", async (req, reply) => {
	const { gameId }: { id: string } | any = req.params;
	const db = fastify.mongo.db!.collection("games");
	try {
		const result = await db.deleteOne({
			_id: gameId,
		});
		log.info(`Deleted Document: ${result?.acknowledged}`);
		reply.status(200).send(result);
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
