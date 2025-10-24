import { z } from 'zod';

// Rating validation
export const ratingSchema = z.object({
  beerId: z.string().uuid(),
  participantId: z.string().uuid(),
  score: z.number()
    .min(1.0, 'Score must be at least 1.0')
    .max(10.0, 'Score must be at most 10.0')
    .refine((val) => val % 0.5 === 0, 'Score must be in 0.5 increments')
});

// Tasting operations
export const createTastingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  creatorName: z.string().min(1, 'Name is required').max(50)
});

export const updateTastingSchema = z.object({
  status: z.enum(['draft', 'active', 'closed']),
  userName: z.string().min(1)
});

// Beer operations
export const addBeerSchema = z.object({
  name: z.string().min(1, 'Beer name is required').max(100),
  brewery: z.string().min(1, 'Brewery is required').max(100),
  style: z.string().max(50).optional(),
  abv: z.number().min(0).max(100).optional(),
  userName: z.string().min(1, 'User name is required')
});

export const editBeerSchema = z.object({
  name: z.string().min(1).max(100),
  brewery: z.string().min(1).max(100),
  style: z.string().max(50).optional(),
  abv: z.number().min(0).max(100).optional(),
  userName: z.string().min(1)
});

export const setCurrentBeerSchema = z.object({
  beerId: z.string().uuid(),
  userName: z.string().min(1)
});

export const finishBeerSchema = z.object({
  userName: z.string().min(1)
});

export const deleteBeerSchema = z.object({
  userName: z.string().min(1)
});

// Participant operations
export const joinTastingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50)
});

export const reclaimSessionSchema = z.object({
  rejoinToken: z.string().uuid()
});

// Admin operations
export const adminAuthSchema = z.object({
  name: z.string().min(1)
});

export const updateUserSchema = z.object({
  isLeader: z.boolean().optional(),
  isAdmin: z.boolean().optional()
}).refine((data) => data.isLeader !== undefined || data.isAdmin !== undefined, {
  message: "At least one field (isLeader or isAdmin) must be provided"
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
