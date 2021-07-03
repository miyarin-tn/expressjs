import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
  const accessToken = jwt.sign({ sub: user._id }, process.env.JWT_SECRET || 'SECRET', { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' });
  const refreshToken = jwt.sign({ sub: user._id }, process.env.JWT_SECRET || 'SECRET', { expiresIn: process.env.JWT_REFRESH_EXPIRES || '1d' });
  return res.send({ accessToken, refreshToken, ...{ user } });
};

const AuthLogoutController = (req: Request, res: Response, next: NextFunction) => {
  return res.send({ message: req.t('AUTH.LOGOUT_SUCCESS') });
};

module.exports = {
  AuthRegisterController,
  AuthLoginController,
  AuthLogoutController
};
