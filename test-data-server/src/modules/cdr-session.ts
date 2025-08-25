// In a top-level file, like server.ts
import 'express-session';

import { DsbCdrUser } from '../models/user';
   declare module 'express-session' {
     interface SessionData {
       cdrUser?: DsbCdrUser;
     }
   }