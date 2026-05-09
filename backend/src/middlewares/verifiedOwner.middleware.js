export const verifiedOwner = (req, res, next) => {
  if (!req.user) return res.respond(401, req.t("middleware.unauthorized"));
  next();
};
