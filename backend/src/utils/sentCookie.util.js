export const sentCookie = (name, res, token, options = {})=>{
    const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
    
    res.cookie(name, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: name === "accessToken" ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        ...options
    });
    
    console.log(`Cookie ${name} set with:`, {
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        httpOnly: true
    });
};