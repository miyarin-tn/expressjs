import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import redis from '../redis';

const VerifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'SECRET');
    // @ts-ignore
    req.user = decoded.user;
    // @ts-ignore
    redis.get('BL_' + decoded.user, (err, data) => {
      if (err) throw err;
      if (data === accessToken) {
        return res.status(401).json({ message: req.t('AUTH.TOKEN_BLACKLISTED') });
      }
      next();
    });
  } catch(err) {
    if (err.message === 'jwt expired') {
      return res.status(401).json({ message: req.t('AUTH.TOKEN_EXPIRED') });
    }
    return res.status(401).json({ message: req.t('AUTH.UNAUTHORIZED') });
  }
};

const VerifyRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const refreshTokenVerify = req.body.token;
  if (!refreshTokenVerify) {
    return res.status(401).json({ message: req.t('AUTH.UNAUTHORIZED') });
  }
  try {
    const decoded = jwt.verify(refreshTokenVerify, process.env.JWT_SECRET || 'SECRET');
    // @ts-ignore
    req.user = decoded.user;
    // @ts-ignore
    redis.get(decoded.user, (err, data) => {
      if (err) throw err;
      if (!data) {
        return res.status(403).json({ message: req.t('AUTH.FORBIDDEN') });
      }
      if (JSON.parse(data).refreshToken !== refreshTokenVerify) {
        return res.status(401).json({ message: req.t('AUTH.UNAUTHORIZED') });
      }
      next();
    });
  } catch(err) {
    if (err.message === 'jwt expired') {
      return res.status(401).json({ message: req.t('AUTH.TOKEN_EXPIRED') });
    }
    return res.status(401).json({ message: req.t('AUTH.UNAUTHORIZED') });
  }
};

module.exports = {
  VerifyAccessToken,
  VerifyRefreshToken
};
