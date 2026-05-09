import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "warn" : "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        // Console — only in development
        ...(process.env.NODE_ENV !== "production"
            ? [new winston.transports.Console({
                format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat)
              })]
            : []),
        // Error logs only
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), winston.format.json()),
        }),
        // All logs
        new winston.transports.File({
            filename: "logs/combined.log",
            format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.json()),
        }),
    ],
});

// Morgan stream — pipes morgan HTTP logs into winston
export const morganStream = {
    write: (message) => logger.http(message.trim()),
};

export default logger;
