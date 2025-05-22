import { z } from 'zod';

// Registration schema
export const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email format').nonempty('Email is required'),
  password: z.string().min(10, 'Password must be at least 10 characters long').nonempty('Password is required'),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').nonempty('Email is required'),
  password: z.string().nonempty('Password is required'),
});
