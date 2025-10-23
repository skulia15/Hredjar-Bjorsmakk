# Beer Tasting App - Implementation Guide

This guide provides the complete architecture and implementation patterns for building out the MVP as defined in PRD.md.

## Status

**✅ Completed:**
- Project structure and configuration
- Prisma schema with all models
- TypeScript types
- Prisma client setup
- Tailwind CSS configuration

**📝 To Implement:**
- API endpoints (15 routes)
- UI pages and components (20+ screens)
- Real-time SSE system
- Session management
- Export functionality

## Architecture Overview

```
src/
├── app/                    # Next.js 15 App Router
│   ├── layout.tsx         # Root layout with React Query
│   ├── page.tsx           # Homepage
│   ├── api/               # API routes
│   │   ├── admin/         # Admin endpoints
│   │   ├── tastings/      # Tasting CRUD
│   │   └── health/        # Health check
│   ├── admin/             # Admin pages
│   ├── t/[id]/            # Tasting pages
│   └── globals.css        # Tailwind styles
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── tasting/           # Tasting-specific
│   └── layout/            # Layout components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── utils.ts          # Helper functions
│   ├── auth.ts           # Auth helpers
│   ├── validation.ts     # Zod schemas
│   └── sse.ts            # SSE management
└── types/                 # TypeScript types
    └── index.ts           # Type definitions
```

## Implementation Order

### Phase 1: Core Infrastructure (30 min)
1. Root layout with React Query Provider
2. Helper utilities (auth, validation, session)
3. Database seed script

### Phase 2: API Endpoints (2-3 hours)
Implement all 15 API routes from PRD Section 8:

#### Admin APIs
- `POST /api/admin/auth` - Admin login
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/[userId]` - Update user (promote/demote)
- `GET /api/admin/tastings` - List all tastings

#### Tasting APIs
- `GET /api/tastings` - List tastings
- `POST /api/tastings` - Create tasting
- `GET /api/tastings/[id]` - Get tasting details
- `PATCH /api/tastings/[id]` - Update tasting status
- `POST /api/tastings/[id]/beers` - Add beer
- `PATCH /api/tastings/[id]/beers/[beerId]` - Edit beer
- `DELETE /api/tastings/[id]/beers/[beerId]` - Delete beer
- `PATCH /api/tastings/[id]/current` - Set current beer
- `POST /api/tastings/[id]/beers/[beerId]/finish` - Finish beer
- `POST /api/tastings/[id]/complete` - Complete tasting

#### Participant APIs
- `POST /api/tastings/[id]/join` - Join tasting
- `POST /api/tastings/[id]/reclaim` - Reclaim session
- `POST /api/tastings/[id]/ratings` - Submit rating
- `GET /api/tastings/[id]/current/pending-raters` - Get pending raters

#### Scores & Export APIs
- `GET /api/tastings/[id]/scores` - Get scores
- `GET /api/tastings/[id]/leaderboard` - Get leaderboard
- `GET /api/tastings/[id]/export` - Export CSV/XLSX

#### Real-time API
- `GET /api/tastings/[id]/stream` - SSE stream

### Phase 3: UI Pages (3-4 hours)
Build all pages from PRD Section 7:

#### Admin Pages
- `/admin` - Admin login
- `/admin/users` - User management

#### Public Pages
- `/` - Homepage with create tasting
- `/t/[id]` - Join tasting page
- `/t/[id]/rate` - Rating view
- `/t/[id]/scores` - Scores page

#### Leader Pages
- `/t/[id]/admin` - Tasting admin (tabs: Rate, Manage, Scores)

### Phase 4: Real-time & Features (2 hours)
- SSE client with fallback polling
- Session persistence
- Wrap-up screen component
- Return to Tasting button
- Export functionality

---

## Detailed Implementation Patterns

### 1. API Route Pattern (Next.js 15 App Router)

**File:** `src/app/api/tastings/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/tastings - List all tastings
export async function GET() {
  try {
    const tastings = await prisma.tasting.findMany({
      include: {
        _count: {
          select: { participants: true, beers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      tastings: tastings.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        createdAt: t.createdAt,
        participantCount: t._count.participants,
        beerCount: t._count.beers
      }))
    });
  } catch (error) {
    console.error('Error fetching tastings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tastings' },
      { status: 500 }
    );
  }
}

// POST /api/tastings - Create new tasting
const createTastingSchema = z.object({
  title: z.string().min(1).max(100),
  creatorName: z.string().min(1).max(50)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, creatorName } = createTastingSchema.parse(body);

    // Find or create user
    const user = await prisma.user.upsert({
      where: { name: creatorName.toLowerCase() },
      update: {},
      create: {
        name: creatorName.toLowerCase(),
        isLeader: false
      }
    });

    // Create tasting
    const tasting = await prisma.tasting.create({
      data: {
        title,
        createdBy: user.id,
        status: 'draft'
      }
    });

    // Create participant for creator
    const participant = await prisma.participant.create({
      data: {
        tastingId: tasting.id,
        userId: user.id,
        code: generateParticipantCode(),
        rejoinToken: crypto.randomUUID()
      }
    });

    return NextResponse.json({
      id: tasting.id,
      title: tasting.title,
      status: tasting.status,
      createdBy: tasting.createdBy,
      participant: {
        id: participant.id,
        userId: participant.userId,
        code: participant.code,
        rejoinToken: participant.rejoinToken,
        isLeader: user.isLeader
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating tasting:', error);
    return NextResponse.json(
      { error: 'Failed to create tasting' },
      { status: 500 }
    );
  }
}

function generateParticipantCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}
```

### 2. Dynamic Route Pattern

**File:** `src/app/api/tastings/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tasting = await prisma.tasting.findUnique({
      where: { id: params.id },
      include: {
        beers: {
          include: {
            _count: {
              select: { ratings: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Calculate averages for each beer
    const beersWithStats = await Promise.all(
      tasting.beers.map(async (beer) => {
        const ratings = await prisma.rating.findMany({
          where: { beerId: beer.id }
        });

        const average = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
          : 0;

        return {
          ...beer,
          averageRating: Number(average.toFixed(2)),
          ratingCount: ratings.length
        };
      })
    );

    return NextResponse.json({
      id: tasting.id,
      title: tasting.title,
      status: tasting.status,
      currentBeerId: tasting.currentBeerId,
      version: tasting.version,
      createdAt: tasting.createdAt,
      beers: beersWithStats,
      currentUserIsLeader: false // TODO: Check from session
    });
  } catch (error) {
    console.error('Error fetching tasting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasting' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, userName } = body;

    // Verify user is leader
    const user = await prisma.user.findUnique({
      where: { name: userName.toLowerCase() }
    });

    if (!user?.isLeader) {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      );
    }

    const tasting = await prisma.tasting.update({
      where: { id: params.id },
      data: {
        status,
        version: { increment: 1 }
      }
    });

    return NextResponse.json({
      id: tasting.id,
      status: tasting.status,
      version: tasting.version
    });
  } catch (error) {
    console.error('Error updating tasting:', error);
    return NextResponse.json(
      { error: 'Failed to update tasting' },
      { status: 500 }
    );
  }
}
```

### 3. React Query Provider Setup

**File:** `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Beer Tasting App',
  description: 'Synchronized beer tasting ratings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**File:** `src/components/providers.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### 4. Page Component Pattern

**File:** `src/app/page.tsx`

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CreateTastingDialog } from '@/components/tasting/create-tasting-dialog'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">🍺 Beer Tasting</h1>
          <p className="mt-2 text-muted-foreground">
            Rate beers together in real-time
          </p>
        </div>

        <div className="space-y-4">
          <CreateTastingDialog />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Link href="/tastings">
            <Button variant="outline" className="w-full">
              Join Existing Tasting
            </Button>
          </Link>

          <Link href="/admin">
            <Button variant="ghost" className="w-full">
              Admin Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### 5. SSE (Server-Sent Events) Implementation

**File:** `src/lib/sse.ts`

```typescript
// SSE connection manager
export class SSEManager {
  private connections: Map<string, Set<ReadableStreamDefaultController>> = new Map();

  addConnection(tastingId: string, controller: ReadableStreamDefaultController) {
    if (!this.connections.has(tastingId)) {
      this.connections.set(tastingId, new Set());
    }
    this.connections.get(tastingId)!.add(controller);
  }

  removeConnection(tastingId: string, controller: ReadableStreamDefaultController) {
    const connections = this.connections.get(tastingId);
    if (connections) {
      connections.delete(controller);
      if (connections.size === 0) {
        this.connections.delete(tastingId);
      }
    }
  }

  broadcast(tastingId: string, event: string, data: any) {
    const connections = this.connections.get(tastingId);
    if (!connections) return;

    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    connections.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch (error) {
        console.error('Error sending SSE message:', error);
      }
    });
  }
}

export const sseManager = new SSEManager();
```

**File:** `src/app/api/tastings/[id]/stream/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { sseManager } from '@/lib/sse';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add connection
      sseManager.addConnection(params.id, controller);

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        sseManager.removeConnection(params.id, controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 6. Session Management

**File:** `src/lib/session.ts`

```typescript
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'bt_participant';
const SESSION_MAX_AGE = Number(process.env.SESSION_COOKIE_MAX_AGE) || 2592000; // 30 days

export async function createParticipantSession(
  participantId: string,
  rejoinToken: string
) {
  cookies().set(SESSION_COOKIE_NAME, rejoinToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function getParticipantFromSession() {
  const cookieStore = cookies();
  const rejoinToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rejoinToken) {
    return null;
  }

  const participant = await prisma.participant.findUnique({
    where: { rejoinToken },
    include: { user: true }
  });

  return participant;
}

export async function clearParticipantSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
```

### 7. Validation Schemas

**File:** `src/lib/validation.ts`

```typescript
import { z } from 'zod';

export const ratingSchema = z.object({
  beerId: z.string().uuid(),
  participantId: z.string().uuid(),
  score: z.number()
    .min(1.0, 'Score must be at least 1.0')
    .max(10.0, 'Score must be at most 10.0')
    .refine((val) => val % 0.5 === 0, 'Score must be in 0.5 increments')
});

export const createTastingSchema = z.object({
  title: z.string().min(1).max(100),
  creatorName: z.string().min(1).max(50)
});

export const addBeerSchema = z.object({
  name: z.string().min(1).max(100),
  brewery: z.string().min(1).max(100),
  style: z.string().optional(),
  abv: z.number().min(0).max(100).optional(),
  userName: z.string()
});

export const joinTastingSchema = z.object({
  name: z.string().min(1).max(50)
});
```

### 8. Export Functionality

**File:** `src/lib/export.ts`

```typescript
import ExcelJS from 'exceljs';
import { prisma } from './prisma';

export async function generateExport(tastingId: string, format: 'csv' | 'xlsx') {
  // Fetch all data
  const tasting = await prisma.tasting.findUnique({
    where: { id: tastingId },
    include: {
      beers: {
        include: {
          ratings: {
            include: {
              participant: {
                include: { user: true }
              }
            }
          }
        },
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  if (!tasting) {
    throw new Error('Tasting not found');
  }

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Individual Ratings
  const ratingsSheet = workbook.addWorksheet('Ratings');
  ratingsSheet.columns = [
    { header: 'Beer Name', key: 'beerName', width: 30 },
    { header: 'Brewery', key: 'brewery', width: 30 },
    { header: 'Participant', key: 'participant', width: 20 },
    { header: 'Code', key: 'code', width: 10 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Timestamp', key: 'timestamp', width: 20 },
  ];

  tasting.beers.forEach(beer => {
    beer.ratings.forEach(rating => {
      ratingsSheet.addRow({
        beerName: beer.name,
        brewery: beer.brewery,
        participant: rating.participant.user.name,
        code: rating.participant.code,
        rating: rating.score,
        timestamp: rating.createdAt.toISOString(),
      });
    });
  });

  // Sheet 2: Summary
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Beer Name', key: 'beerName', width: 30 },
    { header: 'Brewery', key: 'brewery', width: 30 },
    { header: 'Average Rating', key: 'average', width: 15 },
    { header: 'Total Ratings', key: 'count', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Order', key: 'order', width: 10 },
  ];

  tasting.beers.forEach(beer => {
    const ratings = beer.ratings;
    const average = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

    summarySheet.addRow({
      beerName: beer.name,
      brewery: beer.brewery,
      average: average.toFixed(2),
      count: ratings.length,
      status: beer.status,
      order: beer.orderIndex,
    });
  });

  if (format === 'csv') {
    // For CSV, just use the ratings sheet
    return await workbook.csv.writeBuffer();
  } else {
    return await workbook.xlsx.writeBuffer();
  }
}
```

---

## Quick Reference: All API Endpoints

| Method | Path | Purpose | Auth Required |
|--------|------|---------|---------------|
| POST | `/api/admin/auth` | Admin login | None |
| GET | `/api/admin/users` | List users | Admin |
| PATCH | `/api/admin/users/[userId]` | Update user | Admin |
| GET | `/api/admin/tastings` | List all tastings | Admin |
| GET | `/api/tastings` | List tastings | None |
| POST | `/api/tastings` | Create tasting | None |
| GET | `/api/tastings/[id]` | Get tasting | None |
| PATCH | `/api/tastings/[id]` | Update tasting | Leader |
| POST | `/api/tastings/[id]/beers` | Add beer | Leader |
| PATCH | `/api/tastings/[id]/beers/[beerId]` | Edit beer | Leader |
| DELETE | `/api/tastings/[id]/beers/[beerId]` | Delete beer | Leader |
| PATCH | `/api/tastings/[id]/current` | Set current beer | Leader |
| POST | `/api/tastings/[id]/beers/[beerId]/finish` | Finish beer | Leader |
| POST | `/api/tastings/[id]/complete` | Complete tasting | Leader |
| POST | `/api/tastings/[id]/join` | Join tasting | None |
| POST | `/api/tastings/[id]/reclaim` | Reclaim session | None |
| POST | `/api/tastings/[id]/ratings` | Submit rating | Participant |
| GET | `/api/tastings/[id]/current/pending-raters` | Get pending | Leader |
| GET | `/api/tastings/[id]/scores` | Get scores | None |
| GET | `/api/tastings/[id]/leaderboard` | Get leaderboard | None |
| GET | `/api/tastings/[id]/export` | Export data | Leader |
| GET | `/api/tastings/[id]/stream` | SSE stream | None |

---

## Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   ```bash
   # Create .env file
   cp .env.example .env
   # Edit .env with your DATABASE_URL

   # Run migrations
   npx prisma migrate dev --name init

   # Generate Prisma Client
   npx prisma generate
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build out API endpoints** following the patterns above

5. **Build UI pages** starting with homepage and join flow

6. **Add real-time features** (SSE, polling fallback)

7. **Test with multiple browsers** to verify real-time sync

---

## Tips & Best Practices

- **Use React Query** for all data fetching and caching
- **Validate all inputs** with Zod schemas
- **Handle errors gracefully** with try/catch and user-friendly messages
- **Test real-time sync** with 2-3 browser windows
- **Use TypeScript strict mode** to catch errors early
- **Follow mobile-first** design approach
- **Add loading states** for all async operations
- **Implement optimistic updates** for better UX

---

This guide provides all the patterns needed to complete the implementation. Follow the examples and adapt them for each endpoint/page. The architecture is solid and scales well for the MVP requirements.
