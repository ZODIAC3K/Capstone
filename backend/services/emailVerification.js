const nodemailer = require("nodemailer");
const {
	HOST,
	SERVICE,
	EMAIL_PORT,
	SECURE,
	USER,
	PASS,
} = require("../config");

async function sendEmail (email, subject, text) {
	try {
		const transporter = nodemailer.createTransport({
			host: HOST,
			service: SERVICE,
			port: Number(EMAIL_PORT),
			secure: Boolean(SECURE),
			auth: {
				user: USER,
				pass: PASS,
			},
		});

		await transporter.sendMail({
			from: USER,
			to: email,
			subject: subject,
			text: text,
		});
		console.log("Email sent successfully");
	} catch (error) {
		console.log("Email not sent!");
		console.log(error);
		return error;
	}
};

module.exports = sendEmail