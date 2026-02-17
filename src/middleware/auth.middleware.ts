// src/middleware/auth.middleware.ts
import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

export const authenticate = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        roleId: decoded.roleId,
        roleName: decoded.roleName,
        permissions: decoded.permissions,
      };
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expired');
      }
      throw ApiError.unauthorized('Invalid token');
    }
  }
);

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (req.user.roleName === 'admin') {
      return next();
    }

    const hasPermission = requiredPermissions.every(
      (perm) => req.user!.permissions.includes(perm)
    );

    if (!hasPermission) {
      throw ApiError.forbidden(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      );
    }

    next();
  };
};

export const requireAnyPermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (req.user.roleName === 'admin') {
      return next();
    }

    const hasAny = requiredPermissions.some(
      (perm) => req.user!.permissions.includes(perm)
    );

    if (!hasAny) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
};

export const authorize = (requiredRole: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    
    // if (req.user.roleName !== requiredRole) {
    //   throw ApiError.forbidden('Insufficient role permissions');
    // }

    next();
  };
};