const nodemailer = require("nodemailer");
const {
	HOST,
	SERVICE,
	EMAIL_PORT,
	SECURE,
	MAIL_USERNAME,
	MAIL_PASSWORD,
} = require("../config");

console.log(MAIL_USERNAME, MAIL_PASSWORD);

async function sendEmail(email, subject, text) {
	try {
		const transporter = nodemailer.createTransport({
			host: HOST,
			service: SERVICE,
			port: Number(EMAIL_PORT),
			secure: Boolean(SECURE),
			auth: {
				user: MAIL_USERNAME,
				pass: MAIL_PASSWORD,
			},
		});

		await transporter.sendMail({
			from: MAIL_USERNAME,
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
}

module.exports = sendEmail;
