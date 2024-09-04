import { Authenticator } from "@fastify/passport";
import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";
import passportLocal from "passport-local";
import { findUserByUsername } from "../services/userService.js";

export const registerPassport = (
	fastify: FastifyInstance,
	passport: Authenticator
) => {
	passport.use(
		"local",
		new passportLocal.Strategy(async (username, password, done) => {
			const user = await findUserByUsername(fastify, username);
			if (!user || !(await bcrypt.compare(password, user.password))) {
				return done(null, false, {
					message: "Incorrect username or password!",
				});
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
		return await findUserByUsername(fastify, username);
	});
};
