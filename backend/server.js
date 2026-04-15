require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();
const port = Number(process.env.PORT || 4000);

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:19006")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	cors({
		origin: allowedOrigins,
	})
);
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "supplylink-auth" });
});

app.use("/auth", authRoutes);

app.listen(port, () => {
	console.log(`SupplyLink auth API listening on http://localhost:${port}`);
});
