const dotenv = require("dotenv");
dotenv.config({ path: "./config/.env" });

module.exports = {
	APP_PORT: process.env.APP_PORT,
	DEBUG_MODE: process.env.DEBUG_MODE === "true",
	DB_URL: process.env.DB_URL,
	JWT_SECRET: process.env.JWT_SECRET,
	API_KEY: process.env.API_KEY,
	SALT: process.env.SALT,
	APP_URL: process.env.APP_URL,
	HOST: process.env.HOST,
	SERVICE: process.env.SERVICE,
	EMAIL_PORT: process.env.EMAIL_PORT,
	SECURE: process.env.SECURE,
	MAIL_USERNAME: process.env.MAIL_USERNAME,
	MAIL_PASSWORD: process.env.MAIL_PASSWORD,
	F_APP_URL: process.env.F_APP_URL,
	RAZORPAY_ID_KEY: process.env.RAZORPAY_ID_KEY,
	RAZORPAY_SECRET_KEY: process.env.RAZORPAY_SECRET_KEY,
	STABILITY_API_KEY: process.env.STABILITY_API_KEY
};
