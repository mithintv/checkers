import cors from "@fastify/cors";
import mongodb from "@fastify/mongodb";
import passport from "@fastify/passport";
import secureSession from "@fastify/secure-session";
import dotenv from "dotenv";
import Fastify from "fastify";
import { registerPassport } from "./lib/auth.js";
import registerRoutes from "./routes/index.js";
import { registerSocket } from "./services/socketService.js";

dotenv.config();

// Fastify logging configuration
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

fastify.register(mongodb, {
	forceClose: true,
	url: process.env.DB_URI!,
	database: "checkers",
});

fastify.register(cors, {
	origin: [
		"http://localhost:5173",
		"http://localhost:4173",
		"https://checkers-iota.vercel.app",
	], // Allow requests from this origin
	methods: ["GET", "POST", "PATCH", "DELETE"],
});

fastify.register(secureSession, {
	key: Buffer.from(process.env.SECRET_KEY!, "hex"),
});
fastify.register(passport.initialize());
fastify.register(passport.secureSession());

registerPassport(fastify, passport);
registerRoutes(fastify, passport);
registerSocket(fastify);

const port = Number(process.env.PORT) || 80;
fastify.listen({ port: port, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
});
