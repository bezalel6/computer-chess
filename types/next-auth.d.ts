/**
 * NextAuth Type Extensions
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      email?: string | null;
      isGuest: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email?: string | null;
    isGuest: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    isGuest: boolean;
  }
}