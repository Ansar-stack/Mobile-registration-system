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
import db from './src/configs/db/db.config.js';
import { sql } from 'drizzle-orm';

const app = express();

// Request timeout middleware - prevent hanging requests
app.use((req, res, next) => {
  // Set timeout for each request (2 minutes)
  req.setTimeout(120000, () => {
    logger.warn(`Request timeout: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        status: 408,
        message: 'Request timeout'
      });
    }
  });
  
  res.setTimeout(120000, () => {
    logger.warn(`Response timeout: ${req.method} ${req.originalUrl}`);
  });
  
  next();
});

// HTTP request logging via morgan → winston
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));

app.use(express.json());

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
        
        // Instead of throwing error, just deny with false
        // This prevents crashes and allows proper error handling
        logger.warn(`CORS rejected origin: ${origin}`);
        return callback(null, false);
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'x-refresh-token'],
    exposedHeaders: ['x-new-access-token', 'x-new-refresh-token'],
};

app.use(cors(corsOptions));

// Handle CORS errors gracefully
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        logger.warn(`CORS Error: ${req.method} ${req.originalUrl} from origin ${req.headers.origin}`);
        return res.status(403).json({
            success: false,
            status: 403,
            message: 'Origin not allowed by CORS policy'
        });
    }
    next(err);
});

app.options('/{*path}', cors(corsOptions));

// configure the hpp middleware to prevent HTTP Parameter Pollution
app.use(hpp());

// Response Middleware for res.respond()
app.use(responseMiddleware);

// Health check
app.get("/health", async (req, res) => {
  let dbStatus = "ok";
  let dbError = null;

  try {
    await db.run(sql`SELECT 1`);
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

// Error Middleware
app.use(ErrorMiddlware);

// Final catch-all error handler - prevent server crashes
app.use((err, req, res, next) => {
  logger.error(`Unhandled error in final middleware: ${err.stack || err.message}`);
  
  // If headers already sent, delegate to default error handler
  if (res.headersSent) {
    return;
  }
  
  // Send a safe response
  res.status(500).json({
    success: false,
    status: 500,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Internal server error'
  });
});

export default app