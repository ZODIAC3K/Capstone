const { Address, UserDetail } = require("../models");

function fetchAddress(req, res, next) {
	try {
		Address.find({
			user_id: req.__auth.id,
		})
			.then((address) => {
				res.status(200).json({
					status: "sucess",
					data: address,
				});
			})
			.catch((err) => {
				next(err);
			});
	} catch (error) {
		next(error);
	}
}

function addAddress(req, res, next) {
	try {
		const address = JSON.parse(req.body);

		Address.create({...address,user_id: req.__auth.id}).then(address=>{
			UserDetail.findByIdAndUpdate(address.user_id,{
				$push:{
					savedAddress: address,
				}
			})
		}).then(addresses=>{
			res.status(200).json({
				status: "sucess",
				data: addresses
			});
		}).catch(error=>{
			next(error);
		})

	} catch ( error ) {
		next(error)
	}
}

function updateAddress(req, res, next) {
	try {
		const { address } = JSON.parse(req.body);

		Address.insertMany(
			address.map((address) => ({
				...address,
				user_id: req.__auth.id,
			}))
		)
			.then((address) => {
				UserDetail.findByIdAndUpdate(
					address.user_id,
					{
						savedAddress: address,
					},
					{
						runValidators: true,
						new: true,
					}
				)
					.then((user) => {
						res.status(200).json({
							status: "sucess",
							data: user.savedAddress,
						});
					})
					.catch((error) => {
						next(error);
					});
			})
			.catch((error) => {
				next(error);
			});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	fetchAddress,
	updateAddress,
	addAddress,
};
