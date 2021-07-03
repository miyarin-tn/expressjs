import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import redis from '../redis';

// models
import { UserModel } from '../models/user.model';

const AuthRegisterController = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, username, firstname, lastname, phone, birthday, timezone, address } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await UserModel.create({
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
    return res.status(201).send(result);
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
  const token = generateToken(user._id.toString());
  return res.send({ ...token, user });
};

const AuthRefreshController = async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const token = generateToken(req.user);
  return res.send(token);
};

const AuthLogoutController = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1] || '';
  const decoded = jwt.decode(accessToken, { json: true });
  // remove refresh token
  // @ts-ignore
  await redis.del(decoded.user);
  // save access token to blacklist
  // @ts-ignore
  redis.set('BL_' + decoded.user, accessToken);
  return res.send({ message: req.t('AUTH.LOGOUT_SUCCESS') });
};

const generateToken = (userId: string) => {
  const accessToken = jwt.sign({ user: userId }, process.env.JWT_SECRET || 'SECRET', { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' });
  const refreshToken = jwt.sign({ user: userId }, process.env.JWT_SECRET || 'SECRET', { expiresIn: process.env.JWT_REFRESH_EXPIRES || '1d' });
  redis.get(userId.toString(), (err, data) => {
    if (err) throw err;
    redis.set(userId, JSON.stringify({ refreshToken }));
  });
  return { accessToken, refreshToken };
}

module.exports = {
  AuthRegisterController,
  AuthLoginController,
  AuthRefreshController,
  AuthLogoutController
};
