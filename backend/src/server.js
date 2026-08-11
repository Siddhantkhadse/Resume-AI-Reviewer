import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/review", reviewRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Resume AI API is healthy!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

