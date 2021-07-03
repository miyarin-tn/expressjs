import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import redis from '../redis';
import _ from 'lodash';

const VerifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'SECRET');
    // @ts-ignore
    req.user = decoded.user;
    // @ts-ignore
    redis.lrange(`BL_${decoded.user}`, 0, -1, (err, data) => {
      if (err) throw err;
      if (data.includes(accessToken)) {
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
    req.token = refreshTokenVerify;
    // @ts-ignore
    redis.lrange(`RE_${decoded.user}`, 0, -1, (err, data) => {
      if (err) throw err;
      if (_.isEmpty(data)) {
        return res.status(403).json({ message: req.t('AUTH.FORBIDDEN') });
      }
      if (!data.includes(refreshTokenVerify)) {
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
