import { registerAs } from "@nestjs/config";
import type { JwtSignOptions } from "@nestjs/jwt";

export default registerAs(
	"refresh-jwt",
	(): JwtSignOptions => ({
		secret: process.env.REFRESH_JWT_SECRET,
		expiresIn: "60s",
	}),
);
