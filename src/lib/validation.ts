import { z } from 'zod';
import {
  CUSTOM_TAG_MAX_LENGTH, CUSTOM_TAGS_PER_RATING, isCustomTag, normalizeTag, NOTE_MAX_LENGTH,
} from '@/lib/flavorTags';
import { DISPLAY_NAME_MAX_LENGTH } from '@/lib/displayName';

// Identity (who is acting) always comes from the Clerk session, never from these bodies

// Rating validation
export const ratingSchema = z.object({
  beerId: z.string().uuid(),
  score: z.number()
    .min(1.0, 'Score must be at least 1.0')
    .max(10.0, 'Score must be at most 10.0')
    .refine((val) => val % 0.5 === 0, 'Score must be in 0.5 increments'),
  // Omitted fields keep their stored value. Flavor tags are saved apart, see flavorTagsSchema
  note: z.string()
    .trim()
    .max(NOTE_MAX_LENGTH, `Note must be at most ${NOTE_MAX_LENGTH} characters`)
    .transform((note) => note || null)
    .nullable()
    .optional(),
  // Guess at the group average; ignored once the beer's scores are visible
  groupGuess: z.number()
    .min(1, 'Guess must be at least 1')
    .max(10, 'Guess must be at most 10')
    .transform((guess) => Math.round(guess * 10) / 10)
    .nullable()
    .optional()
});

// Flavor tags, saved on every tap without touching the rating
export const flavorTagsSchema = z.object({
  beerId: z.string().uuid(),
  // Fixed keys plus a few short free-text "Annað" tags, normalized so spellings group together
  tags: z.array(z.string().trim().min(1).max(CUSTOM_TAG_MAX_LENGTH))
    .transform((tags) => [...new Set(tags.map(normalizeTag))])
    .refine((tags) => tags.filter(isCustomTag).length <= CUSTOM_TAGS_PER_RATING,
      `At most ${CUSTOM_TAGS_PER_RATING} custom tags`)
});

// Tasting operations
export const createTastingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100)
});

export const updateTastingSchema = z.object({
  status: z.enum(['draft', 'active', 'closed']).optional(),
  hideScoresUntilAllRated: z.boolean().optional()
}).refine((data) => data.status !== undefined || data.hideScoresUntilAllRated !== undefined, {
  message: "At least one field (status or hideScoresUntilAllRated) must be provided"
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

// Display name shown on scores and the projector; not unique
const displayNameSchema = z.string().trim().min(1, 'Name is required').max(DISPLAY_NAME_MAX_LENGTH);

// The signed-in user renaming themselves
export const updateOwnNameSchema = z.object({
  name: displayNameSchema
});

// Admin operations
export const updateUserSchema = z.object({
  isLeader: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  name: displayNameSchema.optional()
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
