const multer = require("multer");
const CustomErrorHandler = require("./CustomErrorHandler");

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "./uploads");
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + "-" + file.originalname);
	},
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		const allowedTypes = ["image/jpeg", "image/png"];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true); // Accept the file
		} else {
			cb(
				CustomErrorHandler.badRequest("Invalid file type. Only JPEG and PNG are allowed."),
				false
			); // Reject the file
		}
	},
});

module.exports = upload;
