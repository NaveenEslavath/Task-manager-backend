import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { Task } from "./entity/Task";
import taskRoutes from "./routes/tasks";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration for Vercel
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite' 
  : (process.env.DB_PATH || "./database.sqlite");

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true, // Set to false in production
  logging: false,
  entities: [Task],
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/tasks", taskRoutes); // Added /api prefix for better API structure

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Task Manager API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Task Manager API is running" });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Initialize database connection
let isDbInitialized = false;

const initializeDatabase = async () => {
  if (!isDbInitialized) {
    try {
      await AppDataSource.initialize();
      console.log("✅ Database connection established");
      isDbInitialized = true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }
};

// For serverless functions, initialize DB on each request
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: "Database initialization failed" });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  });
}

// Export for Vercel
export default app;
