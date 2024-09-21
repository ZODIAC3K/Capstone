const { default: mongoose } = require("mongoose");
const CustomErrorHandler = require("./CustomErrorHandler");

async function populateAllAttributes(document, schema) {
	const pathsToPopulate = schema.paths;
	
	for (const path in pathsToPopulate) {
		if (pathsToPopulate[path].options.ref) {
			await document.populate(path);
		}
	}

	return document
}


module.exports = populateAllAttributes;