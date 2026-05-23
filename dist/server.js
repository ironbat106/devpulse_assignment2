"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_express4 = __toESM(require("express"));

// src/config/index.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));
import_dotenv.default.config({
  path: import_path.default.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT || 5e3
};
var config_default = config;

// src/db/pool.ts
var import_pg = require("pg");
var import_dotenv2 = __toESM(require("dotenv"));
import_dotenv2.default.config();
var pool = new import_pg.Pool({
  connectionString: process.env.CONNECTION,
  ssl: {
    rejectUnauthorized: false
  }
});
var pool_default = pool;

// src/server.ts
var import_dotenv3 = __toESM(require("dotenv"));

// src/app.ts
var import_express3 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));

// src/modules/auth/auth.route.ts
var import_express = __toESM(require("express"));

// src/utils/hash.ts
var import_bcrypt = __toESM(require("bcrypt"));
var hashPassword = async (password) => {
  return await import_bcrypt.default.hash(password, 10);
};
var comparePassword = async (password, hash) => {
  return await import_bcrypt.default.compare(password, hash);
};

// src/utils/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var SECRET = process.env.JWT_SECRET || "secret";
var generateToken = (payload) => {
  return import_jsonwebtoken.default.sign(payload, SECRET, { expiresIn: "7d" });
};
var verifyToken = (token) => {
  return import_jsonwebtoken.default.verify(token, SECRET);
};

// src/modules/auth/auth.controller.ts
var signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashed = await hashPassword(password);
    const result = await pool_default.query(
      `INSERT INTO users(name,email,password,role)
       VALUES ($1,$2,$3,$4)
       RETURNING id,name,email,role,created_at,updated_at`,
      [name, email, hashed, role]
    );
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool_default.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );
    if (!user.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errors: null
      });
    }
    const valid = await comparePassword(
      password,
      user.rows[0].password
    );
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Wrong Password",
        errors: null
      });
    }
    const token = generateToken({
      id: user.rows[0].id,
      name: user.rows[0].name,
      role: user.rows[0].role
    });
    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          role: user.rows[0].role
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// src/modules/auth/auth.route.ts
var router = import_express.default.Router();
router.post("/signup", signup);
router.post("/login", login);
var auth_route_default = router;

// src/modules/issues/issue.route.ts
var import_express2 = __toESM(require("express"));

// src/modules/issues/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    if (title.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: "Title max length is 150"
      });
    }
    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: "Description minimum 20 characters"
      });
    }
    if (!["bug", "feature_request"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: "Invalid issue type"
      });
    }
    const result = await pool_default.query(
      `
      INSERT INTO issues(title,description,type,reporter_id)
      VALUES($1,$2,$3,$4)
      RETURNING *
      `,
      [title, description, type, req.user.id]
    );
    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message
    });
  }
};
var getIssues = async (req, res) => {
  try {
    const { sort = "newest", type, status } = req.query;
    let query = "SELECT * FROM issues";
    const values = [];
    const conditions = [];
    if (type) {
      values.push(type);
      conditions.push(`type=$${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`status=$${values.length}`);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += sort === "oldest" ? " ORDER BY created_at ASC" : " ORDER BY created_at DESC";
    const issuesResult = await pool_default.query(query, values);
    const issues = issuesResult.rows;
    const reporterIds = [
      ...new Set(issues.map((i) => i.reporter_id))
    ];
    const usersResult = await pool_default.query(
      `SELECT id,name,role FROM users WHERE id = ANY($1::int[])`,
      [reporterIds]
    );
    const users = usersResult.rows;
    const formatted = issues.map((issue) => {
      const reporter = users.find((u) => u.id === issue.reporter_id);
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter,
        created_at: issue.created_at,
        updated_at: issue.updated_at
      };
    });
    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issueResult = await pool_default.query(
      "SELECT * FROM issues WHERE id=$1",
      [id]
    );
    if (!issueResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        errors: null
      });
    }
    const issue = issueResult.rows[0];
    const userResult = await pool_default.query(
      "SELECT id,name,role FROM users WHERE id=$1",
      [issue.reporter_id]
    );
    return res.status(200).json({
      success: true,
      data: {
        ...issue,
        reporter: userResult.rows[0] || null
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;
    const issueResult = await pool_default.query(
      "SELECT * FROM issues WHERE id=$1",
      [id]
    );
    if (!issueResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        errors: null
      });
    }
    const issue = issueResult.rows[0];
    if (req.user.role === "contributor" && issue.reporter_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        errors: "Not your issue"
      });
    }
    if (req.user.role === "contributor" && issue.status !== "open") {
      return res.status(409).json({
        success: false,
        message: "Conflict",
        errors: "Issue not open anymore"
      });
    }
    const updated = await pool_default.query(
      `
      UPDATE issues
      SET title=$1, description=$2, type=$3, updated_at=NOW()
      WHERE id=$4
      RETURNING *
      `,
      [title, description, type, id]
    );
    return res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updated.rows[0]
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issueResult = await pool_default.query(
      "SELECT * FROM issues WHERE id=$1",
      [id]
    );
    if (!issueResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        errors: null
      });
    }
    await pool_default.query("DELETE FROM issues WHERE id=$1", [id]);
    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
      data: null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: err.message
    });
  }
};

// src/middleware/auth.middleware.ts
var authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing"
      });
    }
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

// src/middleware/role.middleware.ts
var requireRole = (role) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          errors: "No user in request"
        });
      }
      if (req.user.role !== role) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
          errors: "Insufficient permissions"
        });
      }
      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        errors: "Role check failed"
      });
    }
  };
};

// src/modules/issues/issue.route.ts
var router2 = import_express2.default.Router();
router2.post("/", authMiddleware, createIssue);
router2.get("/", getIssues);
router2.get("/:id", getSingleIssue);
router2.patch("/:id", authMiddleware, updateIssue);
router2.delete(
  "/:id",
  authMiddleware,
  requireRole("maintainer"),
  deleteIssue
);
var issue_route_default = router2;

// src/app.ts
var app = (0, import_express3.default)();
app.use((0, import_cors.default)());
app.use(import_express3.default.json());
app.use(import_express3.default.urlencoded({ extended: true }));
app.use("/api/auth", auth_route_default);
app.use("/api/issues", issue_route_default);
app.get("/", (req, res) => {
  res.json({ message: "DevPulse API Running" });
});
var app_default = app;

// src/server.ts
import_dotenv3.default.config();
var port = config_default.port;
app_default.use(import_express4.default.json());
app_default.use(import_express4.default.text());
app_default.use(import_express4.default.urlencoded({ extended: true }));
var initDB = async () => {
  try {
    await pool_default.query(`
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
app_default.get("/", (req, res) => {
  res.json({ message: "DevPulse API Running" });
});
app_default.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
//# sourceMappingURL=server.js.map