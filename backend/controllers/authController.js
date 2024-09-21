const { SALT, API_KEY, APP_URL, APP_PORT } = require("../config");
const { JwtService, CustomErrorHandler } = require("../services");
const CryptoJS = require("crypto-js");
const {sendEmail, populateAllAttributes} = require("../services");
const { Token, UserDetail, userDetailSchema } = require("../models");
const { insertImage } = require("./imageController");

// Register user ( only email and password )
async function registerUser(req, res, next) {
	try {
		const { email, password, fname, lname, mobile } = req.body;

		const userRec = await UserDetail.findOne({
			email: email,
		}).catch((error) => {
			next(error);
			return;
		});

		if (userRec) {
			next(
				CustomErrorHandler.alreadyExist(
					"Already Exists: User already exists!"
				)
			);
			return;
		}
		
		req.image = req.file != null? await insertImage(req.file) : null

		const userData = {
			email: email,
			password: CryptoJS.AES.encrypt(password, SALT),
			fname: fname,
			lname: lname,
			mobile: mobile,
			profile_picture: req.image
		};

		const user = new UserDetail(userData);
		user.save()
			.then(async (savedUser) => {
				await user.populate('profile_picture');
				const encryptedUserId = JwtService.sign({
					id: savedUser._id,
				});

				const verificationToken = new Token({
					userId: savedUser._id,
					token: JwtService.sign({ userId: savedUser._id }, "1h", API_KEY),
				});
				verificationToken.save().then((token) => {
					const verificationLink = `${APP_URL}:${APP_PORT}/${savedUser._id}/verify/${token.token}`;

					// Send verification email
					const subject = "Email Verification";
					const text = `Click the following link to verify your email: ${verificationLink}`;
					sendEmail(email, subject, text);
				});

				res.cookie("auth-token", encryptedUserId, {
					httpOnly: true,
					maxAge: 7200000,
				});

				const userDetails = {
					email: savedUser.email,
					fname: savedUser.fname,
					lname: savedUser.lname,
					mobile: savedUser.mobile,
					profile_picture: user.profile_picture != null ? {data:user.profile_picture.data,content_type:user.profile_picture.content_type} : null,
					created_at: savedUser.created_at,
					savedAddress: savedUser.savedAddress,
					email_verification: savedUser.email_verification,
					coupon_used: savedUser.coupon_used,
				};

				return res.status(200).json({
					message: "Successfully Registered!",
					redirectTo: "/",
					userDetails,
				});
			})
			.catch((err) => {
				next(err);
				return;
			});
	} catch (err) {
		next(err);
	}
}

// Log user in based on credentials ( email, password )
async function loginUser(req, res, next) {
	try {
		const { email, password } = req.body;

		UserDetail.findOne({
			email: email,
		})
		.then(async (user) => {
			if (!user) {
				next(CustomErrorHandler.notFound("Email Not Found!"));
				return;
			}
			
			const decreptedPass = CryptoJS.AES.decrypt(
				user.password,
				SALT
			).toString(CryptoJS.enc.Utf8);

			if (password != decreptedPass) {
				next(CustomErrorHandler.wrongCredentials("Passowrd Missmatch!"));
				return;
			}

			const encryptedUserId = JwtService.sign({ id: user._id });
			res.cookie("auth-token", encryptedUserId, {
				httpOnly: true,
				maxAge: 7200000,
			});

			user = await populateAllAttributes(user, userDetailSchema);

			const userDetails = {
				email: user.email,
				fname: user.fname,
				lname: user.lname,
				mobile: user.mobile,
				profile_picture: user.profile_picture != null? {data:user.profile_picture.data,content_type:user.profile_picture.content_type} : null,
				created_at: user.created_at,
				savedAddress: user.savedAddress,
				email_verification: user.email_verification,
				coupon_used: user.coupon_used,
			};

			return res.status(200).json({
				message: "Logged in sucessfully!",
				redirectTo: "/",
				userDetails,
			});
		});
	} catch (err) {
		next(err);
		return;
	}
}

const authController = {
	register: registerUser,
	login: loginUser,
};

module.exports = authController;
