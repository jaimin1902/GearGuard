import express from "express";
import helmet from "helmet";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const envMode = process.env.NODE_ENV?.trim() || "DEVELOPMENT";
const port = process.env.PORT || 3000;

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: envMode !== "DEVELOPMENT",
    crossOriginEmbedderPolicy: envMode !== "DEVELOPMENT",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: " * ", credentials: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// API Routes
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import equipmentCategoryRoutes from "./routes/equipmentCategoryRoutes.js";
import workCenterRoutes from "./routes/workCenterRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/equipment-categories", equipmentCategoryRoutes);
app.use("/api/work-centers", workCenterRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);

app.use(errorMiddleware);

app.listen(port, () =>
  console.log("Server is working on Port:" + port + " in " + envMode + " Mode.")
);
