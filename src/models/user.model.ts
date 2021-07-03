import { Schema, model } from 'mongoose';

import { UserType } from '@/types/user';

import { STATUS, ROLES } from '../constants/common';

const userSchema = new Schema<UserType>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: String,
  birthday: Date,
  timezone: String,
  address: String,
  appleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  avatar: String,
  status: { type: String, enum: STATUS, default: 'inactive' },
  role: { type: String, enum: ROLES, default: 'normal' },
  activeCode: String,
  activeCodeExpires: Date
}, {
  timestamps: true,
  versionKey: false
});

export const UserModel = model<UserType>('User', userSchema);
