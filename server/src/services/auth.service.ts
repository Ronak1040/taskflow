import { User, type IUser } from '../models/user.model.js';
import { AppError } from '../utils/appError.js';
import { generateToken } from '../utils/auth.utils.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import type { AuthenticatedUser } from '../types/index.js';

export interface AuthResult {
  user: AuthenticatedUser;
  token: string;
}

export class AuthService {
  /**
   * Register a new user account
   */
  public static async register(input: RegisterInput): Promise<AuthResult> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw AppError.conflict('An account with this email already exists.');
    }

    // Create new user (password is hashed in pre-save hook)
    const user: IUser = await User.create({
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const userObj = user.toJSON() as unknown as AuthenticatedUser;

    return {
      user: userObj,
      token,
    };
  }

  /**
   * Authenticate an existing user
   */
  public static async login(input: LoginInput): Promise<AuthResult> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Explicitly select password field to compare
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Prevent user enumeration by returning identical generic message for wrong email or wrong password
    if (!user) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
      throw AppError.unauthorized('This account has been deactivated.');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const userObj = user.toJSON() as unknown as AuthenticatedUser;

    return {
      user: userObj,
      token,
    };
  }

  /**
   * Fetch authenticated user profile
   */
  public static async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw AppError.notFound('User profile not found.');
    }
    return user.toJSON() as unknown as AuthenticatedUser;
  }
}
