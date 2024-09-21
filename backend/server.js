const express = require("express");
const { DatabaseConnection } = require("./services");
const { APP_PORT } = require("./config");
// This auth contains middlewares that check if the user that is requested has valid credentials or not
const { auth, errorHandler } = require("./middlewares");
const { authRouter, emailVerificationRouter, userRouter, adminRouter, productRouter, orderRouter, bannerRouter, offerRouter } = require("./routes");
const cors = require("cors");
const app = express();

// ================= Cors =================
app.use(cors()); // allows api call from all origin. {remove it in deployment}
// {uncomment below 3 lines in deployment}
// app.use(cors({
//   origin: "localhost:3000" // change it to required URL on deployment.
// }));

// ================= Database Connection =================
const conn = new DatabaseConnection();
conn.connectToDatabase();

app.use(express.urlencoded({ extended: true })); // leave it true because we are dealing with nested json object not the flat json sometime.
app.use(express.json());

// ================= Email Verification  =================
app.use(emailVerificationRouter);

// ================ API KEY AUTH CHECK ================
app.use(auth.apiKey);

// ================ Routes ================
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use('/api/v1/product', productRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/banner', bannerRouter);
app.use('/api/v1/offers', offerRouter)

// ================ Error Handling middleware ================
app.use(errorHandler);

// ================ Display Listening Port ================
app.listen(APP_PORT, () => {
	console.log(`Listening on port ${APP_PORT}`);
});

// ================ Handling Application Shutdown ================
process.on("SIGINT", () => {
	console.log(
		"----------------- Interruption Detected On Server!!! ---------------------------------- Closing Database Connection... -----------------"
	); // server operations intrupted so close the db connection manually.
	conn.closeConnection();
	process.exit(0);
});

module.exports = app;