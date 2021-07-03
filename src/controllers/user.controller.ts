import { Request, Response, NextFunction } from 'express';
import _ from 'lodash';

import { UserModel } from '../models/user.model';
import { STATUS } from '../constants/common';

const UserListController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await UserModel.find({}).exec();
  if (_.isEmpty(result)) {
    return res.status(404).json({ message: req.t('AUTH.NO_ACCOUNT_FOUND') });
  }
  return res.send(result);
};

const UserDetailController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await UserModel.findById(req.params.user_id).exec();
  if (!result) {
    return res.status(404).json({ message: req.t('AUTH.ACCOUNT_NOT_FOUND') });
  }
  return res.send(result);
};

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
  UserDeactiveController
};
