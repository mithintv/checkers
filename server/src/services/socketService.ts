import { ISocketUsers } from "@shared/interfaces";
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";

export const registerSocket = (fastify: FastifyInstance) => {
	const io = new Server(fastify.server, {
		path: "/lobby",
		cors: {
			origin: [
				"https://admin.socket.io",
				"http://localhost:5173",
				"http://localhost:4173",
				"https://checkers-iota.vercel.app",
			], // Allow requests from this origin
			methods: ["GET", "POST"],
			allowedHeaders: ["Content-Type"],
			credentials: true,
		},
	});

	// Handle socket connection events
	const currentUsers: ISocketUsers = {};
	io.on("connection", (socket) => {
		fastify.log.info(`Socket connected: ${socket.id}`);

		// Handle joining a game room
		socket.on("joinGame", ({ userId, username, wins, gameId }) => {
			socket.join(gameId);
			fastify.log.info(
				`User ${userId} joined game: ${gameId} on socket: ${socket.id}`
			);

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
					wins,
					socketId: socket.id,
					position: currentUsers[gameId].length > 0 ? "black" : "red",
				});
			}

			io.to(gameId).emit("currentUsers", currentUsers);
		});

		// Handle updating game state
		socket.on("changeState", ({ userId, gameId, gameState }) => {
			fastify.log.info(`Game ${gameId} updated by ${userId} [${socket.id}]`);
			socket.broadcast.emit("stateChanged", { userId, gameId, gameState });
		});

		// Handle disconnection
		socket.on("disconnect", () => {
			fastify.log.info(`Socket disconnected: ${socket.id}`);
			for (const key in currentUsers) {
				currentUsers[key] = currentUsers[key].filter(
					(x) => x.socketId !== socket.id
				);
			}
		});
	});
};
