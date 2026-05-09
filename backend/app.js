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
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL,
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    credentials: true,
};

app.use(cors(corsOptions));
app.options('/{*any}', cors(corsOptions));

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

// Router 
app.use("/api/v1", router);

// 404 handler
app.use((req, res) => {
    res.respond(404, req.t("middleware.routeNotFound"));
});

// Error Middelware
app.use(ErrorMiddlware);

export default app