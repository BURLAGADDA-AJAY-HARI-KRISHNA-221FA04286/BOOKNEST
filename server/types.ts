// Type definitions for express-session
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    isAdmin?: boolean;
    isVerified?: {[key: number]: boolean};
  }
}