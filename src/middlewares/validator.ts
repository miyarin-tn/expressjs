import { Request, Response, NextFunction } from 'express';
import { check, validationResult, ValidationError } from 'express-validator';
import _ from 'lodash';

import { UserModel } from '../models/user.model';

const RegisterValidator = [
  check('email', 'AUTH.EMAIL_REQUIRED').not().isEmpty(),
  check('email')
    .isEmail()
    .withMessage('AUTH.EMAIL_INVALID'),
  check('email').custom(value => {
    return UserModel.findOne({ email: value }).then(user => {
      if (user) {
        return Promise.reject('AUTH.EMAIL_ALREADY_USED');
      }
    });
  }),
  check('username', 'AUTH.USERNAME_REQUIRED').not().isEmpty(),
  check('username').custom(value => {
    return UserModel.findOne({ username: value }).then(user => {
      if (user) {
        return Promise.reject('AUTH.USERNAME_ALREADY_USED');
      }
    });
  }),
  check('password', 'AUTH.PASSWORD_REQUIRED').not().isEmpty(),
  check('password', 'AUTH.PASSWORD_INVALID').isLength({ min: 5 }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: errors.array().map(e => req.t(e.msg)) });
    }
    next();
  }
];

const LoginValidator = [
  check('email', 'AUTH.EMAIL_OR_USERNAME_REQUIRED').not().isEmpty(),
  check('email', 'AUTH.EMAIL_INVALID').isEmail(),
  check('username', 'AUTH.USERNAME_OR_EMAIL_REQUIRED').not().isEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    let errorResults: ValidationError[] = [];
    if (req.body.email || (!req.body.email && !req.body.username)) {
      errorResults = removeErrorUnnecessary(errors.array(), 'username');
    } else if (req.body.username) {
      errorResults = removeErrorUnnecessary(errors.array(), 'email');
    }
    if (errorResults.length) {
      return res.status(422).json({ message: errorResults.map(e => req.t(e.msg)) });
    }
    next();
  }
];

const removeErrorUnnecessary = (arr: ValidationError[], fieldRemove: string): ValidationError[] => {
  const newErrorsArray = _.cloneDeep(arr);
  const itemError = newErrorsArray.filter(e => e.param === fieldRemove);
  if (itemError.length) {
    itemError.forEach(item => {
      const indexError = newErrorsArray.indexOf(item);
      newErrorsArray.splice(indexError, 1);
    });
  }
  return newErrorsArray;
};

const SocialValidator = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.type) {
    return res.status(400).json({ message: req.t('AUTH.TYPE_SOCIAL_REQUIRED') });
  }
  next();
};

module.exports = {
  RegisterValidator,
  LoginValidator,
  SocialValidator
};
