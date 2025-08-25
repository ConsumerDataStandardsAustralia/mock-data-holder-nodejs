// src/types/express.d.ts or similar
import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    clientId?: string; // Example custom property
    cdrArrangmentId?: string; // Another example
  }
}