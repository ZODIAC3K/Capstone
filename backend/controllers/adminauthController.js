const { SALT } = require("../config");
const { JwtService, CustomErrorHandler } = require("../services");
const CryptoJS = require("crypto-js");
const { populateAllAttributes } = require("../services");
const { Admin, adminSchema } = require("../models");

// Log Admin in based on credentials ( email, password )
async function loginAdmin(req, res, next) {
	try {
		const { email, password } = req.body;
		Admin.findOne({
			email: email,
		}).then(async (user) => {
			if (!user) {
				next(CustomErrorHandler.notFound());
				return;
			}

			const encryptedPass = CryptoJS.AES.encrypt(
				password,
				SALT
			).toString();

			if (!user.password === encryptedPass) {
				next(CustomErrorHandler.wrongCredentials());
				return;
			}

			const encryptedUserId = JwtService.sign({ id: user._id });
			res.cookie("auth-token", encryptedUserId, {
				httpOnly: true,
				maxAge: 7200000,
			});

			user = await populateAllAttributes(user, adminSchema);

			const adminDetails = {
				email: user.email,
				fname: user.fname,
				lname: user.lname,
				mobile: user.mobile,
				profile_picture:
					user.profile_picture != null
						? {
								data: user.profile_picture.data,
								content_type: user.profile_picture.content_type,
						  }
						: null,
				created_at: user.created_at,
			};

			return res.status(200).json({
				message: "Admin Logged in sucessfully!",
				redirectTo: "/adminDashboard",
				adminDetails,
			});
		});
	} catch (err) {
		next(err);
		return;
	}
}

module.exports = { loginAdmin };
