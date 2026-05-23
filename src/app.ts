import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.route.js";
import issueRoutes from "./modules/issues/issue.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Routes */
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

app.get("/", (req, res) => {
  res.json({ message: "DevPulse API Running" });
});

export default app;