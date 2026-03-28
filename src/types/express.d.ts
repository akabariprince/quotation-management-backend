// src/types/express.d.ts
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
    displayName?: string;
    permissions: string[];
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}