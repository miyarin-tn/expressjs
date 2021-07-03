import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

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
  return res.send(user);
};

module.exports = {
  AuthRegisterController,
  AuthLoginController
};
