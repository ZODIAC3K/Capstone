const { default: mongoose } = require("mongoose");
const fs = require("fs");
const { DEBUG_MODE } = require("../config");
const { CustomErrorHandler } = require("../services");

const errorHandler = (err, req, res, next) => {
	let statusCode = 500;
	let data = {
		message: "Internal server error",
		...(DEBUG_MODE && { originalError: err.message }),
	};

	if (err instanceof CustomErrorHandler) {
		statusCode = err.status;
		data = {
			message: err.message,
		};
	}

	if (err instanceof mongoose.Error.ValidationError) {
		statusCode = 400;
		data = {
			error: JSON.stringify(err.errors),
		};
	}

	if (statusCode === 500 && DEBUG_MODE) console.log(err);

	if ( req.file && fs.existsSync(file.path) ){
		fs.unlinkSync(file.path);
	}

	return res.status(statusCode).json(data);
};

module.exports = errorHandler;
