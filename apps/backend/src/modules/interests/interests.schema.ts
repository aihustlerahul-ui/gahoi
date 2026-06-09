import { z } from 'zod';

export const SendInterestSchema = z.object({
  receiverId: z.string().uuid('Invalid profile ID'),
  message: z.string().max(500).optional(),
});

export const RespondInterestSchema = z.object({
  action: z.enum(['accepted', 'declined']),
});

export type SendInterestInput = z.infer<typeof SendInterestSchema>;
export type RespondInterestInput = z.infer<typeof RespondInterestSchema>;
