import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import config from "./config/index";
import pool from "./db/pool";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();
const port = config.port;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'contributor'
        CHECK(role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(30) NOT NULL CHECK(type IN ('bug','feature_request')),
        status VARCHAR(30) DEFAULT 'open'
        CHECK(status IN ('open','in_progress','resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database connected & tables ready");
  } catch (err) {
    console.error("DB Error:", err);
  }
};

initDB();

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "DevPulse API Running" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});