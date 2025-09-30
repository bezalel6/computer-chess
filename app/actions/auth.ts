/**
 * Authentication Server Actions
 *
 * Server-side actions for user registration, login, and username validation.
 */

'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { createUser, getUserByUsername, checkUsernameAvailable } from '@/lib/db/queries';
import { validateUsername, validatePassword } from '@/lib/auth/config';
import { ActionResult, ErrorCode } from '@/types';

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(5).max(30),
  password: z.string().min(8),
  email: z.string().email().optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

/**
 * Register a new user
 */
export async function registerUser(data: {
  username: string;
  password: string;
  email?: string;
}): Promise<ActionResult<{ userId: string; username: string }>> {
  try {
    // Validate input
    const validated = registerSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid input data',
        code: ErrorCode.VALIDATION_ERROR,
      };
    }

    // Validate username format
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.valid) {
      return {
        success: false,
        error: usernameValidation.error!,
        code: ErrorCode.INVALID_USERNAME,
      };
    }

    // Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error!,
        code: ErrorCode.WEAK_PASSWORD,
      };
    }

    // Check if username is available
    const isAvailable = await checkUsernameAvailable(data.username);
    if (!isAvailable) {
      return {
        success: false,
        error: 'Username already taken',
        code: ErrorCode.USERNAME_TAKEN,
      };
    }

    // Check if email is already in use (if provided)
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered',
          code: ErrorCode.VALIDATION_ERROR,
        };
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await createUser({
      username: data.username,
      email: data.email,
      passwordHash,
      isGuest: false,
    });

    return {
      success: true,
      data: {
        userId: user.id,
        username: user.username,
      },
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      error: 'Failed to register user',
      code: ErrorCode.INTERNAL_ERROR,
    };
  }
}

/**
 * Check if username is available
 */
export async function checkUsername(username: string): Promise<{ available: boolean; error?: string }> {
  try {
    // Validate username format
    const validation = validateUsername(username);
    if (!validation.valid) {
      return { available: false, error: validation.error };
    }

    const isAvailable = await checkUsernameAvailable(username);
    return { available: isAvailable };
  } catch (error) {
    console.error('Error checking username:', error);
    return { available: false, error: 'Failed to check username availability' };
  }
}

/**
 * Verify login credentials (used by NextAuth)
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<ActionResult<{ userId: string; username: string; isGuest: boolean }>> {
  try {
    const validated = loginSchema.safeParse({ username, password });
    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid credentials',
        code: ErrorCode.INVALID_CREDENTIALS,
      };
    }

    const user = await getUserByUsername(username);
    if (!user || !user.passwordHash) {
      return {
        success: false,
        error: 'Invalid username or password',
        code: ErrorCode.INVALID_CREDENTIALS,
      };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid username or password',
        code: ErrorCode.INVALID_CREDENTIALS,
      };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        isGuest: user.isGuest,
      },
    };
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return {
      success: false,
      error: 'Authentication failed',
      code: ErrorCode.INTERNAL_ERROR,
    };
  }
}