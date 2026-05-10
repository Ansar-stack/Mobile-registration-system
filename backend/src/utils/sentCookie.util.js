const isProd = process.env.NODE_ENV === "production";

export const sentCookie = (name, res, token, options = {}) => {
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        maxAge: name === "accessToken" ? 30 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        ...options
    };
    console.log(`[Cookie] Setting "${name}" | secure=${cookieOptions.secure} | sameSite=${cookieOptions.sameSite} | maxAge=${cookieOptions.maxAge} | token=${token?.slice(0, 20)}...`);
    res.cookie(name, token, cookieOptions);
};