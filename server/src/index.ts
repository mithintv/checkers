import ws from "@fastify/websocket";
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
await fastify.register(ws);

fastify.get("/", { websocket: true }, (socket, req) => {
	socket.on("message", (message) => {
		socket.send("hi from server");
	});
});

fastify.listen({ port: 5041 }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
});
