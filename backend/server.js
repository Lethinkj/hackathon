require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const providerRoutes = require("./routes/providers");
const foodRoutes = require("./routes/food");
const orderRoutes = require("./routes/orders");
const donationRoutes = require("./routes/donations");
const predictionRoutes = require("./routes/predictions");
const analyticsRoutes = require("./routes/analytics");
const surplusRoutes = require("./routes/surplus");
const listingsRoutes = require("./routes/listings");
const dashboardRoutes = require("./routes/dashboard");
const consumerRoutes = require("./routes/consumer");
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
const devTunnelOriginPattern = /^https:\/\/[a-z0-9-]+-\d+\.[a-z0-9-]+\.devtunnels\.ms$/i;
const isAllowedOrigin =
	(origin) => allowedOriginSet.has(origin) || localhostOriginPattern.test(origin) || devTunnelOriginPattern.test(origin);

app.use((req, res, next) => {
	const origin = req.headers.origin;

	if (origin && !isAllowedOrigin(origin)) {
		if (req.method === "OPTIONS") {
			res.status(403).json({ error: `CORS blocked for origin: ${origin}` });
			return;
		}
		next(new Error(`CORS blocked for origin: ${origin}`));
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
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		optionsSuccessStatus: 204,
	})
);
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "supplylink-auth" });
});

app.get("/__routes", (_req, res) => {
	res.json({
		ok: true,
		routes: [
			"GET /health",
			"GET /auth/me",
			"POST /auth/login",
			"POST /auth/register",
			"GET /api/providers/me",
			"PUT /api/providers/me",
			"GET /api/dashboard/stats",
			"GET /api/listings",
			"POST /api/listings",
			"GET /api/predictions/today",
			"POST /api/predictions/recalculate",
			"POST /api/predictions/products/:predictionId/preorder",
			"GET /api/predictions/preorders/:userId",
			"GET /api/consumer/available-foods",
			"POST /api/orders/preorder",
		],
	});
});

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/food", foodRoutes);
app.use("/orders", orderRoutes);
app.use("/donations", donationRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/surplus", surplusRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/consumer", consumerRoutes);
app.use("/api/orders", consumerRoutes);

app.use((req, res) => {
	res.status(404).json({
		error: `Route not found: ${req.method} ${req.originalUrl}`,
		hint: "Ensure backend is running latest code and routes are mounted in backend/server.js",
	});
});

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
