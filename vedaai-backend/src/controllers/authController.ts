// ============================================================
// VedaAI Backend - Auth Controller
// ============================================================
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config';
import { sendSuccess, sendCreated, sendError } from '../utils/apiResponse';
import { RegisterInput, LoginInput } from '../utils/validators';

// Build sign options once — expiresIn must be a literal string or number
const jwtOptions: SignOptions = {
  expiresIn: (config.jwt.expiresIn as SignOptions['expiresIn']) ?? '7d',
};

const signToken = (payload: object): string =>
  jwt.sign(payload, config.jwt.secret as string, jwtOptions);

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await User.findOne({ email });
  if (existing) {
    sendError(res, 'Email already registered', 409);
    return;
  }

  const user = await User.create({ name, email, password });

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  });

  sendCreated(
    res,
    { token, user: { id: user._id, name: user.name, email: user.email } },
    'Account created successfully'
  );
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  });

  sendSuccess(
    res,
    { token, user: { id: user._id, name: user.name, email: user.email } },
    'Login successful'
  );
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, { id: user._id, name: user.name, email: user.email });
};
