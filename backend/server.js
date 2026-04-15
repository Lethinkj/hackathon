require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/food");
const orderRoutes = require("./routes/orders");
const donationRoutes = require("./routes/donations");
const predictionRoutes = require("./routes/predictions");
const analyticsRoutes = require("./routes/analytics");
const surplusRoutes = require("./routes/surplus");
const { startPredictionScheduler } = require("./services/predictionScheduler");

const app = express();
const port = Number(process.env.PORT || 4000);

const allowedOrigins = (
	process.env.CORS_ORIGINS ||
	"http://localhost:3000,http://localhost:19006,http://localhost:8081,http://localhost:8082,http://127.0.0.1:8081,http://127.0.0.1:8082"
)
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const allowedOriginSet = new Set(allowedOrigins);
const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const isAllowedOrigin = (origin) => allowedOriginSet.has(origin) || localhostOriginPattern.test(origin);

app.use((req, res, next) => {
	const origin = req.headers.origin;

	if (origin && isAllowedOrigin(origin)) {
		res.header("Access-Control-Allow-Origin", origin);
		res.header("Vary", "Origin");
		res.header("Access-Control-Allow-Credentials", "true");
		res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
		res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	}

	if (req.method === "OPTIONS") {
		res.sendStatus(204);
		return;
	}

	next();
});

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) {
				callback(null, true);
				return;
			}

			if (isAllowedOrigin(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error(`CORS blocked for origin: ${origin}`));
		},
		credentials: true,
	})
);
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "supplylink-auth" });
});

app.use("/auth", authRoutes);
app.use("/food", foodRoutes);
app.use("/orders", orderRoutes);
app.use("/donations", donationRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/surplus", surplusRoutes);

startPredictionScheduler();

const server = app.listen(port, () => {
	console.log(`SupplyLink auth API listening on http://localhost:${port}`);
});

server.on("error", (err) => {
	if (err.code === "EADDRINUSE") {
		console.error(`Port ${port} is already in use. Stop the existing backend process or change PORT in backend/.env.`);
		process.exit(1);
	}

	throw err;
});
