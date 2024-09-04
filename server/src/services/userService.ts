import { ObjectId } from "@fastify/mongodb";
import { FastifyInstance } from "fastify";

/**
 * Find user by username
 * @param username
 * @param password
 * @returns user
 */
export const findUserByUserId = async (
	fastify: FastifyInstance,
	userId: string
) => {
	const collection = fastify.mongo.db!.collection("users");
	const user = await collection.findOne({
		_id: new ObjectId(userId),
	});
	return user;
};

/**
 * Find user by username
 * @param username
 * @param password
 * @returns user
 */
export const findUserByUsername = async (
	fastify: FastifyInstance,
	username: string
) => {
	const collection = fastify.mongo.db!.collection("users");
	const user = await collection.findOne({
		username,
	});
	return user;
};
