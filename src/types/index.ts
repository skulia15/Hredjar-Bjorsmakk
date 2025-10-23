// Type definitions based on Prisma models

export type TastingStatus = 'draft' | 'active' | 'closed';
export type BeerStatus = 'untasted' | 'current' | 'finished';

export interface User {
  id: string;
  name: string;
  isLeader: boolean;
  createdAt: Date;
}

export interface Participant {
  id: string;
  tastingId: string;
  userId: string;
  code: string;
  rejoinToken: string;
  lastSeenAt: Date;
  createdAt: Date;
  user?: User;
}

export interface Beer {
  id: string;
  tastingId: string;
  name: string;
  brewery: string;
  style?: string;
  abv?: number;
  orderIndex: number;
  status: BeerStatus;
  createdAt: Date;
  averageRating?: number;
  ratingCount?: number;
}

export interface Rating {
  id: string;
  tastingId: string;
  beerId: string;
  participantId: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  participant?: Participant;
}

export interface Tasting {
  id: string;
  title: string;
  status: TastingStatus;
  currentBeerId?: string | null;
  createdBy?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  beers?: Beer[];
  participants?: Participant[];
  ratings?: Rating[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TastingWithDetails extends Tasting {
  beers: Beer[];
  participants: Participant[];
  currentUserIsLeader: boolean;
}

export interface PendingRatersResponse {
  currentBeerId: string;
  totalParticipants: number;
  ratedCount: number;
  pendingCount: number;
  rated: Array<{
    participantId: string;
    name: string;
    code: string;
    score: number;
    submittedAt: Date;
  }>;
  pending: Array<{
    participantId: string;
    name: string;
    code: string;
  }>;
}

// SSE Event types
export type SSEEventType = 'currentChanged' | 'finished' | 'scoresUpdated' | 'tastingClosed';

export interface SSEEvent {
  event: SSEEventType;
  data: {
    tastingId: string;
    version?: number;
    [key: string]: unknown;
  };
}
