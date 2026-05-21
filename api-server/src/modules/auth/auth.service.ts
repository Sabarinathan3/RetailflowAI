import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../common/errors';
import { JwtPayload, JwtTokens } from '../../common/types';
import { AuthRepository } from './auth.repository';
import {
  RegisterInput,
  LoginInput,
  PinLoginInput,
  RegisterResult,
  LoginResult,
  AuthUser,
} from './auth.types';

export class AuthService {
  constructor(private repo: AuthRepository) {}

  async register(input: RegisterInput): Promise<RegisterResult> {
    // Check if email is already taken
    const exists = await this.repo.checkEmailExists(input.email);
    if (exists) {
      throw new ConflictError('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const { shop, branch, user } = await this.repo.createShopWithOwner({
      shopName: input.shopName,
      ownerName: input.ownerName,
      email: input.email,
      phone: input.phone,
      hashedPassword,
      branchName: input.branchName || 'Main Branch',
      gstNumber: input.gstNumber,
    });

    const tokens = this.generateTokens({
      userId: user.id,
      shopId: shop.id,
      branchId: branch.id,
      role: user.role,
    });

    // Save refresh token
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    await this.repo.saveRefreshToken(user.id, tokens.refreshToken, refreshExpiry);

    await this.repo.updateLastLogin(user.id);

    return {
      user: this.toAuthUser(user),
      shop: { id: shop.id, name: shop.name },
      branch: { id: branch.id, name: branch.name },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    // Try finding user by email first, then phone
    let userRecord = await this.repo.findUserByEmail(input.emailOrPhone);
    if (!userRecord) {
      userRecord = await this.repo.findUserByPhone(input.emailOrPhone);
    }

    if (!userRecord) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!userRecord.password) {
      throw new UnauthorizedError('Password login not available for this user. Use PIN login.');
    }

    const valid = await bcrypt.compare(input.password, userRecord.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if shop is active
    if (!userRecord.shop.isActive) {
      throw new UnauthorizedError('Shop is currently disabled. Contact support.');
    }

    const tokens = this.generateTokens({
      userId: userRecord.id,
      shopId: userRecord.shopId,
      branchId: userRecord.branchId,
      role: userRecord.role,
    });

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    await this.repo.saveRefreshToken(userRecord.id, tokens.refreshToken, refreshExpiry);

    await this.repo.updateLastLogin(userRecord.id);

    return {
      user: this.toAuthUser(userRecord),
      tokens,
    };
  }

  async pinLogin(input: PinLoginInput): Promise<LoginResult> {
    const cashiers = await this.repo.findUsersByShopAndPin(input.shopId);

    if (cashiers.length === 0) {
      throw new NotFoundError('No cashiers found for this shop');
    }

    // Find matching cashier by PIN
    let matchedUser = null;
    for (const cashier of cashiers) {
      if (cashier.pin) {
        const valid = await bcrypt.compare(input.pin, cashier.pin);
        if (valid) {
          matchedUser = cashier;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedError('Invalid PIN');
    }

    const branchId = input.branchId || matchedUser.branchId;

    const tokens = this.generateTokens({
      userId: matchedUser.id,
      shopId: matchedUser.shopId,
      branchId: branchId,
      role: matchedUser.role,
    });

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    await this.repo.saveRefreshToken(matchedUser.id, tokens.refreshToken, refreshExpiry);

    await this.repo.updateLastLogin(matchedUser.id);

    return {
      user: this.toAuthUser(matchedUser),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<JwtTokens> {
    const stored = await this.repo.findRefreshToken(refreshToken);

    if (!stored) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      await this.repo.deleteRefreshToken(refreshToken);
      throw new UnauthorizedError('Refresh token expired');
    }

    // Delete old token
    await this.repo.deleteRefreshToken(refreshToken);

    // Get user info
    const user = await this.repo.findUserById(stored.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new pair
    const tokens = this.generateTokens({
      userId: user.id,
      shopId: user.shopId,
      branchId: user.branchId,
      role: user.role,
    });

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    await this.repo.saveRefreshToken(user.id, tokens.refreshToken, refreshExpiry);

    return tokens;
  }

  private generateTokens(payload: JwtPayload): JwtTokens {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY as any }
    );

    return { accessToken, refreshToken };
  }

  private toAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      shopId: user.shopId,
      branchId: user.branchId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
