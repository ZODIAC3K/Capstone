const { SALT } = require("../config");
const { UserDetail, userDetailSchema } = require("../models");
const {
	CustomErrorHandler,
	populateAllAttributes,
} = require("../services");
const { updateImage, deleteImage, insertImage } = require("./imageController");

function fetchUser(req, res, next) {
	try {
		UserDetail.findById(req.__auth.id).then(async (user) => {
			user = await populateAllAttributes(user, userDetailSchema);

			const userDetails = {
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
				savedAddress: user.savedAddress,
				email_verification: user.email_verification,
				coupon_used: user.coupon_used,
			};

			return res.status(200).json({
				message: "success",
				userDetails,
			});
		});
	} catch (err) {
		next(err);
		return;
	}
}

async function updateUser(req, res, next) {
	try {
		if (req.body._id) {
			next(CustomErrorHandler.badRequest("Can't update id"));
			return;
		}

		if (req.body.password) {
			req.body.password = CryptoJS.AES.encrypt(req.body.password, SALT);
		}

		if (req.file) {
			const user = await UserDetail.findById(req.__auth.id);
			if (user.profile_picture) {
				await updateImage(user.profile_picture, req.file);
			} else {
				req.body.profile_picture = await insertImage(req.file);
			}
		}

		UserDetail.findOneAndUpdate(
			{
				_id: req.__auth.id,
			},
			{
				$set: {
                    ...req.body,
                    modified_at: Date.now()
                },
			},
			{
				new: true,
                runValidators: true
			}
		)
			.then(async (user) => {
				user = await populateAllAttributes(user, userDetailSchema);
				res.status(200).json({
					message: "success",
					userDetails: user,
				});
			})
			.catch((error) => {
				next(error);
				return;
			});
	} catch (err) {
		next(err);
		return;
	}
}

async function deleteUser(req, res, next) {
	try {
		const user = await UserDetail.findById(req.__auth.id);
		await deleteImage(user.profile_picture._id);

		await UserDetail.deleteOne({
			_id: req.__auth.id,
		});

        res.status(200).json({
            message: 'success'
        })
	} catch (err) {
		next(err);
		return;
	}
}

module.exports = {
	fetchUser,
	updateUser,
	deleteUser,
};
