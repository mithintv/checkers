import bcrypt from "bcrypt";

/**
 * Hash password
 * @param password
 * @returns hash
 */
export async function hashPassword(password: string) {
	const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS!));
	return await bcrypt.hash(password, salt);
}
