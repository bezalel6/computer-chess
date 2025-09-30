/**
 * NextAuth v5 Configuration
 *
 * Configures authentication with username/password and guest user support.
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password required');
        }

        // Find user by username
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid username or password');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error('Invalid username or password');
        }

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          isGuest: user.isGuest,
        };
      },
    }),
    Credentials({
      id: 'guest',
      name: 'Guest',
      credentials: {},
      async authorize() {
        // Generate random guest username
        const guestId = Math.random().toString(36).substring(2, 8);
        const guestUsername = `Guest_${guestId}`;

        // Create guest user
        const guestUser = await prisma.user.create({
          data: {
            username: guestUsername,
            isGuest: true,
          },
        });

        return {
          id: guestUser.id,
          name: guestUser.username,
          email: null,
          isGuest: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isGuest = (user as any).isGuest ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isGuest = token.isGuest as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

/**
 * Validation helpers
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  // Username validation: alphanumeric + underscore, 5-30 characters, must start with letter
  if (username.length < 5 || username.length > 30) {
    return { valid: false, error: 'Username must be between 5 and 30 characters' };
  }

  if (!/^[a-zA-Z]/.test(username)) {
    return { valid: false, error: 'Username must start with a letter' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}