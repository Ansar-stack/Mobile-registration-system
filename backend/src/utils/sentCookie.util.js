export const sentCookie = (name, res, token, options = {})=>{
    res.cookie(name, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: name === "accessToken" ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 15min for access, 7 days for refresh
        ...options
    });
};