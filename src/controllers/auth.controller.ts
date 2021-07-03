import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Callback } from 'redis';
import redis from '../redis';
import _ from 'lodash';

import { UserModel } from '../models/user.model';
import { DEVICE } from '../constants/common';

const AuthRegisterController = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, username, firstname, lastname, phone, birthday, timezone, address } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await UserModel.create({
      email,
      password: hash,
      username,
      firstname,
      lastname,
      phone,
      birthday,
      timezone,
      address
    });
    return res.status(201).send({ message: req.t('AUTH.ACCOUNT_CREATE_SUCCESS') });
  } catch(err) {
    return res.status(400).json(err);
  }
};

const AuthLoginController = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, username } = req.body;
  let user;
  if (email) {
    user = await UserModel.findOne({ email: email }).exec();
  } else if (username) {
    user = await UserModel.findOne({ username: username }).exec();
  }
  if (!user) {
    return res.status(404).json({ message: req.t('AUTH.ACCOUNT_NOT_FOUND') });
  }
  const isSame = await bcrypt.compare(password, user.password);
  if (!isSame) {
    return res.status(401).json({ message: req.t('AUTH.ACCOUNT_INCORECT') });
  }
  const token = generateToken(user._id.toString(), undefined, req.headers['user-agent']);
  return res.send({ ...token, ...{ user: _.omit(JSON.parse(JSON.stringify(user)), ['password']) } });
};

const AuthRefreshController = async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const token = generateToken(req.user, req.token);
  return res.send(token);
};

const AuthLogoutController = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1] || '';
  const decoded = jwt.decode(accessToken, { json: true });
  // @ts-ignore
  const userId = decoded.user;
  if (req.body.device === DEVICE.ALL) {
    redisFindInList(userId, async (err, data) => {
      await redis.del(`AC_${userId}`);
      redis.lpush(`BL_${userId}`, data);
    });
  } else if (req.body.device === DEVICE.OTHER && !req.body.token) {
    redisFindInList(userId, async (err, data) => {
      const tokenIndex = data.indexOf(accessToken);
      data.splice(tokenIndex, 1);
      await redis.del(`AC_${userId}`);
      await redis.lpush(`AC_${userId}`, accessToken);
      redis.lpush(`BL_${userId}`, data);
    });
  } else if (req.body.device === DEVICE.OTHER && req.body.token) {
    redisFindInList(userId, async (err, data) => {
      await redis.lrem(`AC_${userId}`, 0, req.body.token);
      redis.lpush(`BL_${userId}`, req.body.token);
    });
  } else {
    // remove refresh token
    await redis.lrem(`AC_${userId}`, 0, accessToken);
    // save access token to blacklist
    redis.lpush(`BL_${userId}`, accessToken);
  }
  return res.send({ message: req.t('AUTH.LOGOUT_SUCCESS') });
};

const generateToken = (userId: string, token?: string, userAgent?: string) => {
  const accessToken = jwt.sign({ user: userId, userAgent }, process.env.JWT_SECRET || 'SECRET', { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' });
  const refreshToken = jwt.sign({ user: userId, userAgent }, process.env.JWT_SECRET || 'SECRET', { expiresIn: process.env.JWT_REFRESH_EXPIRES || '1d' });
  if (token) {
    redis.lrange(`RE_${userId}`, 0, -1, (err, data) => {
      if (err) throw err;
      if (!_.isEmpty(data)) {
        redis.lrem(`RE_${userId}`, 0, token);
      }
    });
  }
  redis.lpush(`AC_${userId}`, accessToken);
  redis.lpush(`RE_${userId}`, refreshToken);
  if (!userAgent) {
    return { accessToken, refreshToken };
  }
  return { accessToken, refreshToken, userAgent };
};

const redisFindInList = (userId: string, callback: Callback<string[]>) => {
  redis.lrange(`AC_${userId}`, 0, -1, async (err, data) => {
    if (err) throw err;
    if (!_.isEmpty(data)) {
      callback(err, data);
    }
  });
};

module.exports = {
  AuthRegisterController,
  AuthLoginController,
  AuthRefreshController,
  AuthLogoutController
};
