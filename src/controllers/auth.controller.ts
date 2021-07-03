import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Callback } from 'redis';
import redis from '../redis';
import JwksRsa from 'jwks-rsa';
// import appleSignin from 'apple-signin-auth';
import { OAuth2Client } from 'google-auth-library';
import _ from 'lodash';

import { UserModel } from '../models/user.model';
import { SocialType } from '@/types/user';
import { DEVICE, STATUS } from '../constants/common';

const jwksClient = JwksRsa({
  jwksUri: 'https://appleid.apple.com/auth/keys'
});
const clientGG = new OAuth2Client(process.env.GG_CLIENT_ID);

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

const AuthSocialController = async (req: Request, res: Response, next: NextFunction) => {
  const { type, token, firstname, lastname } = req.body;
  if (type.toLowerCase() === 'apple') {
    const decoded = jwt.decode(token, { complete: true });
    const kid = decoded?.header.kid;
    const key = await jwksClient.getSigningKey(kid);
    const appPublicKey = key.getPublicKey();
    try {
      const verify = jwt.verify(token, appPublicKey);
      const result: SocialType = {
        // @ts-ignore
        id: verify.sub,
        // @ts-ignore
        email: verify.email || `${verify.sub}@yuulocal.com`,
        // @ts-ignore
        username: verify.sub,
        firstname: firstname || req.body.firstname || 'Anonymous',
        lastname: lastname || req.body.lastname || 'User',
        timezone: req.body.timezone
      };
      checkInDatabaseAndResponse(req, res, 'appleId', result);
    } catch(err) {
      return res.status(401).json({ message: req.t('AUTH.AUTHENTICATION_FAIL', { social: 'Apple' }) });
    }
  } else if (type.toLowerCase() === 'facebook') {
    try {
      let response = await axios.get(`https://graph.facebook.com/oauth/access_token?client_id=${process.env.FB_CLIENT_ID}&client_secret=${process.env.FB_CLIENT_SECRET}&grant_type=client_credentials`)
      const appToken = response.data.access_token;
      response = await axios.get(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appToken}`);
      const { user_id } = response.data.data;
      response = await axios.get(`https://graph.facebook.com/v11.0/${user_id}?fields=id,email,first_name,last_name,picture&access_token=${appToken}`);
      const { id, email, first_name, last_name, picture } = response.data;
      const result: SocialType = {
        id: id,
        email: email || `${id}@yuulocal.com`,
        username: id,
        firstname: first_name,
        lastname: last_name,
        avatar: picture.data.url,
        timezone: req.body.timezone
      };
      checkInDatabaseAndResponse(req, res, 'facebookId', result);
    } catch(err) {
      return res.status(401).json({ message: req.t('AUTH.AUTHENTICATION_FAIL', { social: 'Facebook' }) });
    }
  } else if (type.toLowerCase() === 'google') {
    try {
      const prePayload = await clientGG.verifyIdToken({
        idToken: token,
        audience: process.env.GG_CLIENT_ID
      });
      const preResult = prePayload.getPayload();
      const result: SocialType = {
        // @ts-ignore
        id: preResult.sub,
        // @ts-ignore
        email: preResult.email || `${preResult.sub}@yuulocal.com`,
        // @ts-ignore
        username: preResult.sub,
        // @ts-ignore
        firstname: preResult.given_name,
        // @ts-ignore
        lastname: preResult.family_name,
        // @ts-ignore
        avatar: preResult.picture,
        timezone: req.body.timezone
      }
      checkInDatabaseAndResponse(req, res, 'googleId', result);
    } catch(err) {
      return res.status(401).json({ message: req.t('AUTH.AUTHENTICATION_FAIL', { social: 'Google' }) });
    };
  }
};

const AuthCallbackController = async (req: Request, res: Response, next: NextFunction) => {
  if (req.params.type_id === 'apple') {
    if (!req.body.id_token) {
      return res.status(401).json({ message: req.t('AUTH.AUTHENTICATION_FAIL', { social: 'Apple' }) });
    } else {
      if (!process.env.CLIENT_WEBSITE_AUTH_LINK) {
        return res.send(req.body);
      } else {
        return res.redirect(`${process.env.CLIENT_WEBSITE_AUTH_LINK}?token=${req.body.id_token}`);
      }
    }
  }
  return res.status(400).json({ message: req.t('AUTH.NO_DATA_FROM_CALLBACK') });
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

const checkInDatabaseAndResponse = async (req: Request, res: Response, field: string, data: SocialType) => {
  const user = await UserModel.findOne({ [field]: data.id }).exec();
  // create account if it is not exist
  if (!user) {
    try {
      const userCheck = await UserModel.findOne({
        $or: [
          { email: data.email },
          { username: data.username }
        ]
      }).exec();
      if (userCheck) {
        return res.status(422).json({ message: req.t('AUTH.ACCOUNT_ALREADY_USED') });
      }
      const hash = await bcrypt.hash(`${data.id}${new Date().getTime()}`, 10);
      await UserModel.create({
        email: data.email,
        username: data.username,
        password: hash,
        firstname: data.firstname,
        lastname: data.lastname,
        timezone: data.timezone,
        [field]: data.id,
        avatar: data.avatar,
        status: STATUS[0]
      });
      const userReFind = await UserModel.findOne({ [field]: data.id }).exec();
      // get data of user
      const token = generateToken(data.id, undefined, req.headers['user-agent']);
      return res.send({ ...token, ...{ user: _.omit(JSON.parse(JSON.stringify(userReFind)), ['password']) } });
    } catch(err) {
      return res.status(400).json(err);
    }
  }
  // get data of user
  const token = generateToken(data.id, undefined, req.headers['user-agent']);
  return res.send({ ...token, ...{ user: _.omit(JSON.parse(JSON.stringify(user)), ['password']) } });
}

module.exports = {
  AuthRegisterController,
  AuthLoginController,
  AuthSocialController,
  AuthCallbackController,
  AuthRefreshController,
  AuthLogoutController
};
