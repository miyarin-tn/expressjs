import { Schema, model } from 'mongoose';

import { UserType } from '@/types/user';

import { STATUS, ROLES } from '../constants/common';

const userSchema = new Schema<UserType>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, trim: true },
  username: { type: String },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: String,
  birthday: Date,
  timezone: String,
  address: String,
  status: { type: String, enum: STATUS, default: 'inactive' },
  role: { type: String, enum: ROLES, default: 'normal' },
  activeCode: String,
  activeCodeExpires: Date
}, {
  timestamps: true,
  versionKey: false
});

export const UserModel = model<UserType>('User', userSchema);
