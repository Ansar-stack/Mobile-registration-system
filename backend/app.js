import express, { urlencoded } from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import cors from 'cors'
import morgan from 'morgan';
import router from './src/routes/routes.js';
import { responseMiddleware } from './src/middlewares/response.middleware.js';
import { ErrorMiddlware } from './src/middlewares/error.middleware.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import logger, { morganStream } from './logs/logger.js';
import hpp from 'hpp';
import { t } from './src/utils/i18n.util.js';

const app = express();

// Helmet for security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, 
     directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  })
);

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
const frontendURLs = [
  "https://register-mobile.vercel.app"
];
const a = 324;
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || frontendURLs.includes(origin)) {
            return callback(null, true);
        }
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

// Router 
app.use("/api/v1", router);

// 404 handler
app.use((req, res) => {
    res.respond(404, req.t("middleware.routeNotFound"));
});

// Error Middelware
app.use(ErrorMiddlware);

export default app