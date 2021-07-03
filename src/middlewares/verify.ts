import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const VerifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'SECRET');
    // @ts-ignore
    req.user = decoded.user;
    next();
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
    
    const accessToken = jwt.sign({ sub: decoded.sub }, process.env.JWT_SECRET || 'SECRET', { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' });
    const refreshToken = jwt.sign({ sub: decoded.sub }, process.env.JWT_SECRET || 'SECRET', { expiresIn: process.env.JWT_REFRESH_EXPIRES || '1d' });
    return res.send({ accessToken, refreshToken });
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
