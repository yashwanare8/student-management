
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();

// Allow local development and your deployed Netlify frontend
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  process.env.FRONTEND_URL?.replace(/\/$/, "")
].filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header (e.g. Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Parse JSON request bodies
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Student API is running");
});

// Student routes
app.use("/api/students", require("./routes/studentRoutes"));

// MCP writes use a separate token so the credential never needs to be exposed to the browser.
app.use("/api/mcp", require("./middleware/mcpAuth"));
app.use("/api/mcp/students", require("./routes/studentRoutes"));
app.use("/api/mcp/settings", require("./routes/mcpSettingsRoutes"));
app.use("/api/settings", require("./routes/siteSettingsRoutes"));

// Error handler
app.use((err, req, res, next) => {
  if (err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// Start server only after MongoDB connects
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
