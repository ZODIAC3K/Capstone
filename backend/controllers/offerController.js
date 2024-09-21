const { OfferDetails, offerSchema } = require("../models");
const { populateAllAttributes, CustomErrorHandler } = require("../services");

function getOffers(req, res, next) {
	try {
		OfferDetails.find().then((offers) => {
			res.status(200).json({
				status: "sucessful",
				data: {
					offers,
				},
			});
		});
	} catch (error) {
		next(error);
		return;
	}
}

function getOfferById(req, res, next) {
	try {
		const id = req.params.id;

		OfferDetails.findById(id).then((offer) => {
			populateAllAttributes(offer, offerSchema)
				.then((offers) => {
					res.status(200).json({
						status: "sucessful",
						data: {
							offers,
						},
					});
				})
				.catch((error) => {
					next(error);
					return;
				});
		});
	} catch (error) {
		next(error);
		return;
	}
}

function getOffersByFilter(req, res, next) {
	try {
		const query = req.body;

		if (query.applicable_on) {
			query.applicable_on = {
				$in: query.applicable_on,
			};
		}

		OfferDetails.find(query)
			.populate("applicable_on")
			.then((offers) => {
				res.status(200).json({
					status: "sucessful",
					data: {
						offers,
					},
				});
			});
	} catch (error) {
		next(error);
		return;
	}
}

function createOffer(req, res, next) {
	try {
		const fields = [
			"offer_discount",
			"title",
			"description",
			"applicable_on",
			"end_at",
		];
		for (const key of fields) {
			if (req.body.hasOwnProperty(key) && req.body[key] === undefined) {
				throw CustomErrorHandler.badRequest(` ${key} is undefined `);
			} else if (!req.body.hasOwnProperty(key)) {
				throw CustomErrorHandler.badRequest(
					` ${key} is not present the query `
				);
			}
		}

		const query = req.body;

		query.end_at = new Date(end_at);
		query.offer_discount = new Number(offer_discount);
		query.applicable_on = {
			$in: query.applicable_on.split(","),
		};

		const offer = new OfferDetails(query);

		offer.save().then((offer) => {
			populateAllAttributes(offer, offerSchema)
				.then((offers) => {
					res.status(200).json({
						status: "sucessful",
						data: {
							offers,
						},
					});
				})
				.catch((error) => {
					next(error);
					return;
				});
		});
	} catch (error) {
		next(error);
		return;
	}
}

function updateOffer(req, res, next) {
	try {
		const query = req.body;

		if (query.offer_discount) {
			query.offer_discount = new Number(query.offer_discount);
		}

		if (query.end_at) {
			query.end_at = new Date(query.end_at);
		}

		if (query.applicable_on) {
			query.applicable_on = {
				$in: query.applicable_on.split(","),
			};
		}

		OfferDetails.findByIdAndUpdate(id, query, {
			runValidators: true,
			new: true,
		}).then((offer) => {
			populateAllAttributes(offer, offerSchema)
				.then((offers) => {
					res.status(200).json({
						status: "sucessful",
						data: {
							offers,
						},
					});
				})
				.catch((error) => {
					next(error);
					return;
				});
		});
	} catch (error) {
		next(error);
		return;
	}
}

function deleteOffer(req, res, next) {
	try {
		const { id } = req.params;

		OfferDetails.findByIdAndDelete(id)
			.then(() => {
				res.status(200).json({
					status: "sucessful",
					data: null,
				});
			})
			.catch((error) => {
				next(error);
				return;
			});
	} catch (error) {
		next(error);
		return;
	}
}

function deleteOffers(req, res, next) {
	try {
		const { ids } = req.body;
		ids = ids.split(",");

		OfferDetails.deleteMany({ _id: { $in: ids } })
			.then(() => {
				res.status(200).json({
					status: "sucessful",
					data: null,
				});
			})
			.catch((error) => {
				next(error);
				return;
			});
	} catch (error) {
		next(error);
		return;
	}
}

module.exports = {
	getOffers,
	getOfferById,
	getOffersByFilter,
	createOffer,
	updateOffer,
	deleteOffer,
	deleteOffers,
};
