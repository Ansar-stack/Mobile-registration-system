import jwt from 'jsonwebtoken'

export const accessTokenGenerator = (payload, expiresIn = '30m') => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn });
};

export const refreshTokenGenerator = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
};
