import { z } from 'zod';

// Identity (who is acting) always comes from the Clerk session, never from these bodies

// Rating validation
export const ratingSchema = z.object({
  beerId: z.string().uuid(),
  score: z.number()
    .min(1.0, 'Score must be at least 1.0')
    .max(10.0, 'Score must be at most 10.0')
    .refine((val) => val % 0.5 === 0, 'Score must be in 0.5 increments')
});

// Tasting operations
export const createTastingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100)
});

export const updateTastingSchema = z.object({
  status: z.enum(['draft', 'active', 'closed'])
});

// Beer operations
export const editBeerSchema = z.object({
  name: z.string().min(1).max(100),
  brewery: z.string().min(1).max(100),
  style: z.string().max(50).optional(),
  abv: z.number().min(0).max(100).optional()
});

export const setCurrentBeerSchema = z.object({
  beerId: z.string().uuid()
});

// Admin operations
export const updateUserSchema = z.object({
  isLeader: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  name: z.string().trim().min(1).max(50).optional()
}).refine((data) => data.isLeader !== undefined || data.isAdmin !== undefined || data.name !== undefined, {
  message: "At least one field (isLeader, isAdmin or name) must be provided"
});

export const linkUserSchema = z.object({
  legacyUserId: z.string().uuid()
});

// Helper to validate and return parsed data or error
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: 'Invalid input' };
  }
}
