import { Authenticator } from "@fastify/passport";
import { FastifyInstance } from "fastify";
import authRoutes from "./authRoutes.js";
import gameRoutes from "./gameRoutes.js";
import userRoutes from "./userRoutes.js";

export default function registerRoutes(
	fastify: FastifyInstance,
	passport: Authenticator
) {
	fastify.register(authRoutes, passport);
	fastify.register(gameRoutes);
	fastify.register(userRoutes);
}
