export const sentCookie = (name, res, token, options = {}) => {
    res.cookie(name, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: name === "accessToken" ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        ...options
    });
};