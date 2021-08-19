import { Request, Response, NextFunction } from 'express';
import _ from 'lodash';

import { UserModel } from '../models/user.model';
import { STATUS } from '../constants/common';

const UserListController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await UserModel.find({}).select('-password').exec();
  if (_.isEmpty(result)) {
    return res.status(404).json({ message: req.t('AUTH.NO_ACCOUNT_FOUND') });
  }
  return res.send(result);
};

const UserDetailController = async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (req.params.user_id === 'me' || req.params.user_id === req.user) {
    // @ts-ignore
    const result = await UserModel.findById(req.user).select('-password').exec();
    if (!result) {
      return res.status(404).json({ message: req.t('AUTH.ACCOUNT_NOT_FOUND') });
    }
    return res.send(result);
  } else {
    const result = await UserModel.findById(req.params.user_id).select([
      '_id',
      'email',
      'username',
      'firstname',
      'lastname',
      'phone',
      'birthday',
      'address',
      'avatar',
      'status'
    ]).exec();
    if (!result) {
      return res.status(404).json({ message: req.t('AUTH.ACCOUNT_NOT_FOUND') });
    }
    return res.send(result);
  }
};

const UserUpdateController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    await UserModel.findByIdAndUpdate(req.user, req.body).exec();
    // @ts-ignore
    const result = await UserModel.findByIdAndUpdate(req.user, req.body).exec();
    return res.send(result);
  } catch {
    return res.status(404).json({ message: req.t('UNKNOWN.ERROR') });
  }
}

const UserDeactiveController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    await UserModel.findOneAndUpdate({ _id: req.user, status: { $eq: STATUS[0] } }, { status: STATUS[2] }).exec();
    return res.send({ message: req.t('AUTH.ACCOUNT_DELETED_SUCCESS') });
  } catch {
    return res.status(404).json({ message: req.t('UNKNOWN.ERROR') });
  }
};

module.exports = {
  UserListController,
  UserDetailController,
  UserUpdateController,
  UserDeactiveController
};
