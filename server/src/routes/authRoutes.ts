import { Authenticator } from "@fastify/passport";
import { FastifyInstance } from "fastify";
import { hashPassword } from "../lib/utils.js";

export default async function gameRoutes(
	fastify: FastifyInstance,
	passport: Authenticator
) {
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
			fastify.log.info(
				`A document was inserted with the _id: ${result.insertedId}`
			);
			res.status(200).send(result);
		} catch (error) {
			fastify.log.error(error);
			res.status(500).send(error);
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
		res
			.clearCookie("session")
			.status(200)
			.send({ message: "Logged out successfully" });
	});
}
