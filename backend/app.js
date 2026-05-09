import express, { urlencoded } from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import cors from 'cors'
import morgan from 'morgan';
import router from './src/routes/routes.js';
import { responseMiddleware } from './src/middlewares/response.middleware.js';
import { ErrorMiddlware } from './src/middlewares/error.middleware.js';
import rateLimit from 'express-rate-limit';
import logger, { morganStream } from './logs/logger.js';
import hpp from 'hpp';
import { t } from './src/utils/i18n.util.js';

const app = express();

app.use(express.json());

// HTTP request logging via morgan → winston
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));


app.use(urlencoded({extended: true}));
app.use(cookieParser());

// API Rate limitting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: (req) => {
        const lang = (req.headers["accept-language"] || "en").split(",")[0].split("-")[0].trim();
        return { success: false, status: 429, message: t(lang, "middleware.tooManyRequests") };
    }
});
app.use(limiter);

// Cross origin
const allowedOrigins = [
  "https://register-mobile.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL,
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.log('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// configure the hpp middleware to prevent HTTP Parameter Pollution
app.use(hpp());

// Response Middleware for res.respond()
app.use(responseMiddleware);

// Health check
app.get("/health", async (req, res) => {
  let dbStatus = "ok";
  let dbError = null;

  try {
    const { createClient } = await import("@libsql/client");
    const isLocal = process.env.DB_MODE === "local";
    const client = createClient(
      isLocal
        ? { url: process.env.LOCAL_DATABASE_URL }
        : { url: process.env.DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
    );
    await client.execute("SELECT 1");
  } catch (err) {
    dbStatus = "error";
    dbError = err.message;
  }

  const healthy = dbStatus === "ok";
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 200 : 503,
    message: healthy ? "Server is running" : "Database connection failed",
    environment: process.env.NODE_ENV || "development",
    db: {
      mode: process.env.DB_MODE || "local",
      status: dbStatus,
      ...(dbError && { error: dbError }),
    },
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// Temporary seed endpoint (REMOVE AFTER USE)
app.post("/seed-admin", async (req, res) => {
  try {
    const bcrypt = await import("bcrypt");
    const { eq } = await import("drizzle-orm");
    const db = (await import("./src/db/index.js")).default;
    const { users } = await import("./src/db/schema.js");

    const email = "admin@gmail.com";
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    
    if (existing) {
      return res.json({ success: false, message: "Admin already exists" });
    }

    await db.insert(users).values({ 
      email, 
      password: await bcrypt.hash("admin123", 10), 
      role: "admin" 
    });
    
    res.json({ success: true, message: "Admin user created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug endpoint to check users (REMOVE AFTER USE)
app.get("/debug-users", async (req, res) => {
  try {
    const db = (await import("./src/db/index.js")).default;
    const { users } = await import("./src/db/schema.js");
    
    const allUsers = await db.select({ id: users.id, email: users.email, role: users.role }).from(users);
    
    res.json({ 
      success: true, 
      count: allUsers.length,
      users: allUsers 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});

// Debug endpoint to check cookies (REMOVE AFTER USE)
app.get("/debug-cookies", (req, res) => {
  res.json({
    success: true,
    cookies: req.cookies,
    headers: {
      origin: req.headers.origin,
      cookie: req.headers.cookie
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      FRONTEND_URL: process.env.FRONTEND_URL
    }
  });
});

// Router 
app.use("/api/v1", router);

// 404 handler
app.use((req, res) => {
    res.respond(404, req.t("middleware.routeNotFound"));
});

// Error Middelware
app.use(ErrorMiddlware);

export default app