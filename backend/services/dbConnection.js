const mongoose = require("mongoose");
const { DB_URL } = require("../config");

class DatabaseConnection extends mongoose.Connection {
	constructor() {
		super();
	}

	connectToDatabase(urlDb = DB_URL) {
		mongoose.set("strictQuery", true); // Telling mongo to follow schemas strictly. for mongo V7+
		mongoose.connect(urlDb, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		mongoose.connection.on("connected", () => {
			console.log("Connected to the database");
		});

		mongoose.connection.on("error", (err) => {
			console.error("Database connection error:", err);
		});

		mongoose.connection.on("disconnected", () => {
			console.log("Disconnected from the database");
		});
	}

	closeConnection() {
		mongoose.connection.close(() => {
			console.log("Connection to the database closed");
		});
	}
}

// function dbConnect() {
// 	mongoose.set("strictQuery", true); // Telling mongo to follow schemas strictly. for mongo V7+
// 	mongoose.connect(DB_URL, {
// 		useNewUrlParser: true,
// 		useUnifiedTopology: true,
// 	});
// 	const db = mongoose.connection;
// 	db.on("error", console.error.bind(console, "connection error: "));
// 	db.once("open", () => {
// 		console.log("Database Connected...");
// 	});
// }

module.exports = DatabaseConnection;
