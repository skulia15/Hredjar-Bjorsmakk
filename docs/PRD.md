# 🍺 Beer Tasting App - Product Requirements Document

> **Version:** 2.0 (Implementation-Ready)  
> **Last Updated:** October 23, 2025  
> **Status:** Ready for Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Scope](#2-scope)
3. [Users & Roles](#3-users--roles)
4. [Platform & Tech Stack](#4-platform--tech-stack)
5. [Data Model](#5-data-model)
6. [Features & User Stories](#6-features--user-stories)
7. [Screens & User Flows](#7-screens--user-flows)
8. [API Specification](#8-api-specification)
9. [Real-time & State Management](#9-real-time--state-management)
10. [Authentication & Security](#10-authentication--security)
11. [Accessibility & i18n](#11-accessibility--i18n)
12. [Performance Requirements](#12-performance-requirements)
13. [Observability](#13-observability)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment & DevOps](#15-deployment--devops)
16. [Definition of Done](#16-definition-of-done)
17. [Risks & Mitigations](#17-risks--mitigations)
18. [Seed Data](#18-seed-data)
19. [Non-Functional Requirements](#19-non-functional-requirements)
20. [Environment Configuration](#20-environment-configuration)

---

## 1) Product Overview

### Product Name
**hreðjar bjórsmakk** (Beer Tasting App)

### Problem Statement
Beer tastings often get messy and unstructured — people forget which beer they're on, ratings get lost, and results aren't collected consistently. This tool provides a simple web interface for everyone to join via link, rate beers in sync, and instantly see averages. It keeps everyone aligned, prevents data loss, and makes sharing results effortless.

### Solution
A mobile-first web app where:
- Leaders create tastings and manage the flow
- Participants join via link and rate beers
- Everyone sees the current beer in real-time
- Results are automatically collected and exportable
- No accounts or complex setup required

---

## 2) Scope

### Must-Haves (MVP)

1. **Global User System**
   - Users identified by name only (case-insensitive unique)
   - Auto-created on first join
   - Global leader status (applies to all tastings)
   - Admin panel for user management

2. **Admin Panel**
   - Accessible via `/admin` with name authentication ("admin")
   - Manage users: view all users, promote/demote leaders
   - View all tastings
   - Admin does NOT need to be a leader

3. **Leader Capabilities**
   - Create tastings (simple 3-click flow)
   - Add beers with name + brewery
   - Select current beer from untasted list
   - Mark beers as finished
   - Complete tasting
   - Export results to CSV/XLSX
   - Can also rate beers (dual role)

4. **Participant Experience**
   - Join via URL (`/t/{tastingId}`)
   - Enter display name (auto-rejoins if same name)
   - Rate current beer: visual star display + numeric input (1.0-10.0, step 0.5)
   - Edit ratings until beer is finished
   - View live scores page

5. **Real-time Synchronization**
   - All participants see the same current beer within ≤1s
   - SSE (Server-Sent Events) with 1s polling fallback
   - Live updates on ratings, beer changes, and completions

6. **Wrap-up Flow**
   - When beer is finished, show wrap-up to participants (NOT leaders)
   - Display: beer name, average (2 decimals), count of ratings
   - Minimum 5 seconds duration
   - After 5 seconds: show leaderboard of ALL finished beers
   - Leaders pick next beer while participants see waiting state

7. **Scores Page**
   - Shows all finished beers with averages
   - Updates live during tasting
   - Accessible to all participants
   - Displays leaderboard: all finished beers sorted by average (descending)
   - Medal indicators for top 3 (🥇🥈🥉)

8. **Session Persistence**
   - Participants never lose their session
   - Auto-rejoin with same name (case-insensitive)
   - Ratings preserved across refreshes and device switches

9. **Pending Raters Display**
   - Leaders see who has/hasn't rated current beer
   - Shows count: "8 people have already rated"
   - Lists pending raters (alphabetical)
   - Lists completed raters with scores (submission order)

10. **Global Navigation**
    - "Return to Tasting" button visible on all non-main-tasting pages
    - Only shown when a tasting is active
    - Main tasting page = current beer rating view

### Nice-to-Haves (Future Versions)
- QR code generation for join links
- Tappable star rating interface
- Notes field on ratings
- Live stats: median, distribution histograms
- Beer catalog with vintage tracking
- Email recovery for admin access
- WebSocket instead of SSE
- PWA offline support

### Out of Scope
- Full user accounts with passwords
- PDF reports
- Complex permission systems
- Social features (comments, likes)
- Mobile native apps
- Payment/premium features

---

## 3) Users & Roles

| Role | Authentication | Permissions | Scope |
|------|---------------|-------------|-------|
| **Admin** | Name = "admin" on `/admin` page | - Manage all users<br>- Promote/demote leaders<br>- View all tastings<br>- **Cannot** manage tastings unless also a leader | Global |
| **Leader** | Auto-detected by `User.isLeader` flag when joining | - Create tastings<br>- Add/edit/delete beers<br>- Set current beer<br>- Mark beer finished<br>- Complete tasting<br>- View pending raters<br>- Export data<br>- **Can also rate beers** | Global (all tastings) |
| **Participant** | Name entry on join (auto-creates User if new) | - Join tastings via link<br>- Rate beers (1.0-10.0)<br>- Edit own ratings until beer finished<br>- View scores page | Per-tasting |

### Key Concepts

- **Admin ≠ Leader**: Admin manages users, Leader manages tastings
- **Global Leaders**: Once promoted, a user is a leader for ALL tastings
- **Dual Role**: Leaders can both manage tastings AND submit ratings
- **Name-Based Identity**: Users identified solely by display name (case-insensitive)
- **No Deletion**: Users and participants cannot be deleted (data integrity)

---

## 4) Platform & Tech Stack

### Target Platform
**Web app only** — mobile-first responsive UI for iOS/Android browsers and desktop.

### Technology Stack

#### Frontend
- **Framework:** Next.js 15 (App Router)
- **React:** React 19
- **Language:** TypeScript
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form
- **Styling:** Tailwind CSS
- **State Management:** React Query (TanStack Query)
- **Date/Time:** date-fns (Claude Code's choice if preferred)
- **Real-time:** SSE (Server-Sent Events) with polling fallback

#### Backend
- **API:** Next.js API Routes (App Router)
- **Database:** PostgreSQL (Neon or Supabase)
- **ORM:** Prisma
- **Authentication:** Simple name-based (httpOnly cookies)
- **File Generation:** exceljs (Claude Code's choice if preferred)

#### Hosting & Infrastructure
- **Hosting:** Vercel
- **Edge Functions:** Where possible for API routes
- **Database:** Neon (serverless Postgres) or Supabase
- **CDN:** Vercel's built-in CDN

#### Development Tools
- **Package Manager:** npm or pnpm
- **Linting:** ESLint
- **Formatting:** Prettier
- **Testing:** Vitest (unit), Playwright (E2E)
- **Monitoring:** Sentry

### Concurrency Target
20 simultaneous users per tasting

### Browser Support
- iOS Safari 15+
- Chrome/Edge 100+
- Firefox 100+
- Mobile-first design

---

## 5) Data Model

### Entity Relationship Diagram

```
User (1) ──< (N) Participant (N) >── (1) Tasting
                                              │
                                              ├── (N) Beer
                                              │
                                              └── (N) Rating
                                                       │
                                                       └── (FK: Participant, Beer)
```

### Prisma Schema

```prisma
// Global user registry
model User {
  id            String        @id @default(uuid())
  name          String        @unique  // Case-insensitive in queries
  isLeader      Boolean       @default(false)
  createdAt     DateTime      @default(now())
  
  participations Participant[]
  
  @@index([name])
}

// Per-tasting participation
model Participant {
  id            String   @id @default(uuid())
  tastingId     String
  tasting       Tasting  @relation(fields: [tastingId], references: [id], onDelete: Cascade)
  
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  code          String   // 4-char alphanumeric, unique per tasting
  rejoinToken   String   @unique
  lastSeenAt    DateTime @default(now())
  createdAt     DateTime @default(now())
  
  ratings       Rating[]
  
  @@unique([tastingId, userId])  // One participation per user per tasting
  @@unique([tastingId, code])
  @@index([rejoinToken])
}

// Tasting event
model Tasting {
  id            String   @id @default(uuid())
  title         String
  status        String   @default("draft")  // "draft" | "active" | "closed"
  currentBeerId String?
  createdBy     String?  // User.id who created it
  
  version       Int      @default(1)  // Increments on state changes
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  beers         Beer[]
  participants  Participant[]
  ratings       Rating[]
  
  @@index([status])
  @@index([createdAt])
}

// Beer in a tasting
model Beer {
  id            String   @id @default(uuid())
  tastingId     String
  tasting       Tasting  @relation(fields: [tastingId], references: [id], onDelete: Cascade)
  
  name          String
  brewery       String
  style         String?
  abv           Float?
  orderIndex    Int      @default(0)
  status        String   @default("untasted")  // "untasted" | "current" | "finished"
  
  createdAt     DateTime @default(now())
  
  ratings       Rating[]
  
  @@index([tastingId, status])
  @@index([tastingId, orderIndex])
}

// Rating submission
model Rating {
  id              String   @id @default(uuid())
  tastingId       String
  tasting         Tasting  @relation(fields: [tastingId], references: [id], onDelete: Cascade)
  
  beerId          String
  beer            Beer     @relation(fields: [beerId], references: [id], onDelete: Cascade)
  
  participantId   String
  participant     Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  
  score           Float    // 1.0 to 10.0, step 0.5
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([beerId, participantId])  // One rating per beer per participant
  @@index([beerId])
  @@index([participantId])
}

// Admin authentication
model AdminAuth {
  id            String   @id @default(uuid())
  passwordHash  String   // Hash of "admin" or custom secret
  lastLoginAt   DateTime?
  
  @@map("admin_auth")
}
```

### Data Model Rules

1. **User Uniqueness:**
   - `User.name` is unique globally (case-insensitive in queries)
   - Same name = same user (auto-rejoin behavior)

2. **Leader Status:**
   - `User.isLeader` applies globally across all tastings
   - When a leader joins any tasting, they get leader controls

3. **Participant Code:**
   - Auto-generated 4-character alphanumeric (e.g., "A4F2")
   - Unique per tasting
   - Used for disambiguation in admin UI

4. **Tasting Status:**
   - `draft`: Created but not started; beers can be added
   - `active`: In progress; current beer set; ratings accepted
   - `closed`: Completed; no new ratings; results viewable

5. **Beer Status:**
   - `untasted`: Not yet rated; available for selection as current
   - `current`: Currently being rated (only one per tasting)
   - `finished`: Rated and completed; shows in leaderboard

6. **Rating Rules:**
   - One rating per (participantId, beerId) — enforced by unique constraint
   - Resubmitting updates the existing rating (upsert behavior)
   - Ratings can be edited until beer status = "finished"

7. **Current Beer:**
   - Exactly one `currentBeerId` per tasting when status = "active"
   - When beer becomes "finished", `currentBeerId` is unset
   - Leader must explicitly select next beer (no auto-advance)

8. **Version Control:**
   - `Tasting.version` increments on state changes (current beer change, finish, etc.)
   - Used for optimistic concurrency control
   - Clients refetch if their version < server version

9. **Cascading Deletes:**
   - Deleting a Tasting cascades to all Beers, Participants, and Ratings
   - Users are NOT deleted when tastings are deleted

10. **Beer Editing:**
    - `name`, `brewery`, `style`, `abv`, `orderIndex` editable while tasting is active
    - Editing does NOT alter existing ratings (ratings stay linked by `beerId`)

11. **Beer Deletion:**
    - Only allowed if `status = "untasted"` AND no ratings exist
    - Cannot delete current or finished beers

12. **Session Persistence:**
    - `Participant.rejoinToken` stored in httpOnly cookie (fallback: localStorage)
    - Auto-reclaim on page load
    - If same name entered, system links to existing User.id

---

## 6) Features & User Stories

### 6.1) Admin: Initial Setup

**Story:**
> As an **Admin**, I want to authenticate and manage users, so that I can control who has leader privileges.

**Acceptance Criteria:**
- GIVEN I visit `/admin`
- WHEN I enter the name "admin"
- THEN I am authenticated and redirected to `/admin/users`
- AND I can view all users with their leader status
- AND I can promote/demote users to/from leader role

---

### 6.2) Admin: Promote User to Leader

**Story:**
> As an **Admin**, I want to promote any user to leader status, so they can manage tastings.

**Acceptance Criteria:**
- GIVEN I am on `/admin/users`
- WHEN I click "Promote to Leader" on a participant
- THEN their `User.isLeader` flag is set to `true`
- AND the next time they join any tasting, they see leader controls

---

### 6.3) Leader: Create Tasting

**Story:**
> As a **Leader**, I want to create a new tasting with minimal friction, so I can start managing it immediately.

**Acceptance Criteria:**
- GIVEN I am on the homepage
- WHEN I click "Create New Tasting"
- AND enter a tasting name
- AND enter my name
- THEN a new tasting is created with `status = "draft"`
- AND I am redirected to the tasting admin interface
- AND I see a shareable participant link (e.g., `beerrating.app/t/abc123`)

---

### 6.4) Leader: Add Beers

**Story:**
> As a **Leader**, I want to add beers with their names and breweries, so participants can rate them.

**Acceptance Criteria:**
- GIVEN I am in the Beers tab of a tasting
- WHEN I submit the "Add Beer" form with name and brewery
- THEN the beer appears in the untasted list
- AND it is assigned an `orderIndex` (sequential)

---

### 6.5) Leader: Start Tasting

**Story:**
> As a **Leader**, I want to start the tasting, so participants can begin rating.

**Acceptance Criteria:**
- GIVEN I have added at least one beer to a draft tasting
- WHEN I click "Start Tasting"
- THEN the tasting status changes to `active`
- AND participants can now join and rate

---

### 6.6) Leader: Select Current Beer

**Story:**
> As a **Leader**, I want to select which beer is currently being rated, so everyone stays synchronized.

**Acceptance Criteria:**
- GIVEN the tasting is active
- WHEN I select a beer from the untasted list
- THEN `Tasting.currentBeerId` is set to that beer
- AND `Beer.status` changes to "current"
- AND `Tasting.version` increments
- AND all participants see the new current beer within ≤1s

---

### 6.7) Leader: Finish Beer

**Story:**
> As a **Leader**, I want to mark the current beer as finished, so we can move to the next one.

**Acceptance Criteria:**
- GIVEN there is a current beer with at least one rating
- WHEN I click "Finish Beer"
- THEN the beer's status changes to "finished"
- AND `Tasting.currentBeerId` is unset
- AND `Tasting.version` increments
- AND all participants see the wrap-up screen (average, count) for ≥5 seconds
- AND after 5 seconds, participants see the leaderboard of all finished beers
- AND I (leader) see the interface to select the next beer

---

### 6.8) Leader: View Pending Raters

**Story:**
> As a **Leader**, I want to see who hasn't rated the current beer yet, so I know when to move on.

**Acceptance Criteria:**
- GIVEN there is a current beer
- WHEN I view the Live tab
- THEN I see a count: "X people have already rated"
- AND I see a list of participants who have rated (with their scores, ordered by submission time)
- AND I see a list of participants who haven't rated yet (alphabetical)
- AND the lists update in real-time as ratings come in

---

### 6.9) Leader: Complete Tasting

**Story:**
> As a **Leader**, I want to complete the tasting, so no more ratings can be submitted.

**Acceptance Criteria:**
- GIVEN I am managing an active tasting
- WHEN I click "Complete Tasting"
- THEN the tasting status changes to "closed"
- AND participants can no longer submit ratings
- AND all results remain viewable and exportable

---

### 6.10) Leader: Export Results

**Story:**
> As a **Leader**, I want to export all ratings to a file, so I can share and archive results.

**Acceptance Criteria:**
- GIVEN I am in the Export tab
- WHEN I click "Download CSV" or "Download XLSX"
- THEN a file is generated with:
  - Sheet/Section 1: Individual ratings (Beer Name, Brewery, Participant, Code, Rating, Timestamp)
  - Sheet/Section 2: Summary (Beer Name, Brewery, Average, Count, Status, Order)
- AND the file downloads to my device

---

### 6.11) Participant: Join Tasting

**Story:**
> As a **Participant**, I want to join a tasting via link, so I can rate beers.

**Acceptance Criteria:**
- GIVEN I visit `/t/{tastingId}`
- WHEN I enter my name
- THEN if a User with that name (case-insensitive) exists, I am linked to that User
- ELSE a new User is created with my name
- AND a Participant record is created for this tasting
- AND I am redirected to the current beer rating view (if tasting is active)
- OR I see a "Tasting not started yet" message (if draft)
- OR I see the results page (if closed)

---

### 6.12) Participant: Rate Current Beer

**Story:**
> As a **Participant**, I want to rate the current beer, so my opinion is recorded.

**Acceptance Criteria:**
- GIVEN I am viewing the current beer
- WHEN I enter a rating (1.0-10.0, step 0.5) in the numeric input
- AND click "Submit"
- THEN my rating is saved (upsert behavior)
- AND I see confirmation (e.g., "Rating submitted")
- AND I can edit my rating until the beer is finished

---

### 6.13) Participant: See Wrap-up Screen

**Story:**
> As a **Participant**, I want to see the average rating when a beer is finished, so I know how the group felt.

**Acceptance Criteria:**
- GIVEN the current beer is marked as finished
- WHEN the wrap-up triggers
- THEN I see:
  - Beer name
  - Average rating (2 decimal places)
  - Total number of ratings
- AND the wrap-up displays for a minimum of 5 seconds
- AND after 5 seconds, I see the leaderboard of all finished beers
- AND a message: "Waiting for next beer... 🍺"

---

### 6.14) Participant: View Scores Page

**Story:**
> As a **Participant**, I want to view all finished beers and their scores, so I can see the overall rankings.

**Acceptance Criteria:**
- GIVEN I am in an active or completed tasting
- WHEN I navigate to the Scores page
- THEN I see all finished beers with:
  - Beer name and brewery
  - Average rating (2 decimals)
  - Total ratings count
  - Medals for top 3 (🥇🥈🥉)
- AND the list is sorted by average rating (descending)
- AND the page updates live during an active tasting

---

### 6.15) Participant: Return to Tasting

**Story:**
> As a **Participant**, I want to quickly return to the main tasting page from anywhere, so I don't miss rating.

**Acceptance Criteria:**
- GIVEN I am on any page except the main tasting rating view
- AND there is an active tasting I've joined
- WHEN I see the "Return to Tasting" button
- AND click it
- THEN I am redirected to the current beer rating page

---

### 6.16) System: Real-time Synchronization

**Story:**
> As the **System**, I want to keep all clients synchronized, so everyone sees the same current beer.

**Acceptance Criteria:**
- GIVEN a state change occurs (current beer change, finish, etc.)
- WHEN the server increments `Tasting.version`
- THEN an SSE event is broadcast to all connected clients
- AND clients with `version < server.version` refetch tasting state
- AND all clients display the new current beer within ≤1s (SSE) or ≤2s (polling)

---

### 6.17) System: Session Persistence

**Story:**
> As the **System**, I want to preserve participant sessions across refreshes, so users don't lose progress.

**Acceptance Criteria:**
- GIVEN a participant joins a tasting
- WHEN their session is created
- THEN `Participant.rejoinToken` is stored in an httpOnly cookie
- AND on page reload, the token is read from the cookie
- AND the participant is auto-rejoined (same Participant.id)
- AND their previous ratings are still visible

---

## 7) Screens & User Flows

### 7.1) Terminology

| Term | Definition |
|------|------------|
| **Tasting** | An event session where a group rates multiple beers |
| **Beer** | A single beer entry with name and brewery |
| **Current Beer** | The beer currently being rated by all participants (only one at a time) |
| **Participant** | A person who joins a tasting to rate beers |
| **Leader** | A user with global privileges to manage any tasting (can also rate) |
| **Admin** | A special user who manages users and leader promotions (not necessarily a leader) |
| **Wrap-up Screen** | Temporary overlay shown after a beer is finished, displaying average and count |
| **Scores Page** | Persistent page showing leaderboard of all finished beers |
| **Return to Tasting Button** | Global navigation element to return to the active tasting's rating page |
| **Waiting State** | What participants see between beers (after wrap-up, before next beer selected) |

---

### 7.2) Screen Inventory

#### Public Pages (No Auth Required)
- **Homepage** (`/`)
- **Join Page** (`/join`)
- **Tasting Selection List** (`/tastings`)
- **Direct Tasting Link** (`/t/{id}`)
- **Current Beer Rating View** (`/t/{id}/rate`)
- **Scores Page** (`/t/{id}/scores`)
- **Results Page** (`/t/{id}/results`)

#### Leader Pages (Leader Status Required)
- **Tasting Admin** (`/t/{id}/admin`)
  - Beers Tab
  - Live Tab
  - Export Tab
- **Leader Rating View** (`/t/{id}/leader/rate`) - Shows rating form + leader controls

#### Admin Pages (Admin Auth Required)
- **Admin Login** (`/admin`)
- **User Management** (`/admin/users`)
- **All Tastings View** (`/admin/tastings`)

---

### 7.3) User Flow: Admin Setup

```
┌────────────────────────────────────────┐
│ 1. Admin visits: /admin                │
│                                         │
│ 2. Sees login form:                    │
│    ┌─────────────────────────────────┐ │
│    │ Admin Authentication            │ │
│    │                                 │ │
│    │ Name: [_____________]           │ │
│    │                                 │ │
│    │ [Authenticate]                  │ │
│    └─────────────────────────────────┘ │
│                                         │
│ 3. Enters "admin" → clicks auth        │
│                                         │
│ 4. Redirected to: /admin/users         │
│                                         │
│ 5. User Management Interface:          │
│    ┌─────────────────────────────────┐ │
│    │ Users                           │ │
│    │                                 │ │
│    │ ┌───────────────────────────┐   │ │
│    │ │ Skuli                     │   │ │
│    │ │ 🔧 Leader                 │   │ │
│    │ │ Joined: Jan 15, 2025      │   │ │
│    │ │ [Demote]                  │   │ │
│    │ └───────────────────────────┘   │ │
│    │                                 │ │
│    │ ┌───────────────────────────┐   │ │
│    │ │ Eiki                      │   │ │
│    │ │ 👤 Participant            │   │ │
│    │ │ Joined: Jan 20, 2025      │   │ │
│    │ │ [Promote to Leader] ←─────┼───┼─ Click
│    │ └───────────────────────────┘   │ │
│    │                                 │ │
│    │ [View All Tastings]             │ │
│    └─────────────────────────────────┘ │
│                                         │
│ 6. Eiki is now promoted to leader      │
│    → Next join, he sees leader UI      │
└────────────────────────────────────────┘
```

---

### 7.4) User Flow: Leader Creates & Starts Tasting

```
┌────────────────────────────────────────┐
│ 1. Leader visits homepage: /           │
│                                         │
│ 2. Sees prominent button:               │
│    ┌─────────────────────────────────┐ │
│    │  Create New Tasting             │ │ ← Click
│    └─────────────────────────────────┘ │
│                                         │
│ 3. Modal/page appears:                 │
│    ┌─────────────────────────────────┐ │
│    │ Create Tasting                  │ │
│    │                                 │ │
│    │ Tasting Name:                   │ │
│    │ [Friday Night Beers_________]   │ │
│    │                                 │ │
│    │ Your Name:                      │ │
│    │ [Skuli_____________________]    │ │
│    │                                 │ │
│    │ [Create]                        │ │ ← Click
│    └─────────────────────────────────┘ │
│                                         │
│ 4. System:                              │
│    - Creates Tasting (status: draft)   │
│    - Links to User "Skuli" (leader)    │
│    - Creates Participant record        │
│                                         │
│ 5. Redirected to: /t/{id}/admin        │
│                                         │
│ 6. Welcome banner shows:                │
│    ┌─────────────────────────────────┐ │
│    │ 🔗 Share: beerrating.app/t/... │ │
│    │ [Copy Link]                     │ │
│    └─────────────────────────────────┘ │
│                                         │
│ 7. Leader adds beers:                  │
│    ┌─────────────────────────────────┐ │
│    │ Add Beer                        │ │
│    │ Name: [IPA Sample___________]   │ │
│    │ Brewery: [Brewery A_________]   │ │
│    │ [Add Beer]                      │ │
│    └─────────────────────────────────┘ │
│                                         │
│ 8. Repeat adding beers...              │
│                                         │
│ 9. Click "Start Tasting"               │
│    → Status: draft → active            │
│    → Participants can now join         │
│                                         │
│ 10. Select first beer as current       │
│     → All participants see it          │
└────────────────────────────────────────┘
```

---

### 7.5) User Flow: Participant Joins & Rates

```
┌────────────────────────────────────────┐
│ 1. Participant receives link:          │
│    beerrating.app/t/abc123             │
│                                         │
│ 2. Clicks link → visits /t/abc123      │
│                                         │
│ 3. Sees name entry:                    │
│    ┌─────────────────────────────────┐ │
│    │ Join Tasting                    │ │
│    │                                 │ │
│    │ Friday Night Beers              │ │
│    │                                 │ │
│    │ Enter your name:                │ │
│    │ [Eiki______________________]    │ │
│    │                                 │ │
│    │ [Join]                          │ │
│    └─────────────────────────────────┘ │
│                                         │
│ 4. System checks:                      │
│    - User "Eiki" exists? → Yes         │
│    - isLeader? → No                    │
│    - Create Participant record         │
│    - Generate rejoinToken              │
│    - Store in cookie                   │
│                                         │
│ 5. Redirected to: /t/abc123/rate       │
│                                         │
│ 6. Current Beer View:                  │
│    ┌─────────────────────────────────┐ │
│    │ 🍺 IPA Sample                   │ │
│    │ Brewery A                       │ │
│    │                                 │ │
│    │ ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ (visual)    │ │
│    │                                 │ │
│    │ Your Rating:                    │ │
│    │ [8.5_____] (1.0 - 10.0)         │ │
│    │                                 │ │
│    │ [Submit Rating]                 │ │
│    │                                 │ │
│    │ [View Scores]                   │ │
│    └─────────────────────────────────┘ │
│                                         │
│ 7. Enters rating → clicks submit       │
│    → Rating saved (upsert)             │
│    → Confirmation: "Rating submitted"  │
│                                         │
│ 8. Can edit rating until finished      │
│                                         │
│ 9. When leader finishes beer:          │
│    → Wrap-up overlay appears           │
│                                         │
│ 10. Wrap-up Screen (5+ seconds):       │
│     ┌─────────────────────────────────┐│
│     │ 🍺 IPA Sample                   ││
│     │ Brewery A                       ││
│     │                                 ││
│     │ ⭐ 8.25 / 10                    ││
│     │ (12 ratings)                    ││
│     │                                 ││
│     │ Waiting for next beer... 🍺     ││
│     └─────────────────────────────────┘│
│                                         │
│ 11. After 5 sec → Leaderboard:         │
│     ┌─────────────────────────────────┐│
│     │ Top Beers So Far                ││
│     │                                 ││
│     │ 🥇 IPA Sample - 8.25 ⭐ (12)    ││
│     │ 🥈 Stout X - 8.10 ⭐ (11)       ││
│     │ 🥉 Lager Y - 7.95 ⭐ (12)       ││
│     │                                 ││
│     │ Waiting for next beer... 🍺     ││
│     └─────────────────────────────────┘│
│                                         │
│ 12. Leader selects next beer           │
│     → All participants see new beer    │
│     → Cycle repeats                    │
└────────────────────────────────────────┘
```

---

### 7.6) User Flow: Leader During Active Tasting

```
┌────────────────────────────────────────┐
│ Leader View: /t/{id}/admin             │
│                                         │
│ Tabs: [Rate] [Manage] [Scores]         │
│                                         │
│ ──────── Rate Tab ──────────            │
│ (Same as participant view)              │
│ ┌─────────────────────────────────┐    │
│ │ 🍺 IPA Sample                   │    │
│ │ Your Rating: [8.5___]           │    │
│ │ [Submit Rating]                 │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ──────── Manage Tab ──────────          │
│ ┌─────────────────────────────────┐    │
│ │ Current Beer                    │    │
│ │ 🍺 IPA Sample - Brewery A       │    │
│ │                                 │    │
│ │ [Finish Beer]                   │    │
│ │                                 │    │
│ │ ─────────────────────           │    │
│ │                                 │    │
│ │ Select Next Beer:               │    │
│ │ [Dropdown: Untasted beers___▾]  │    │
│ │                                 │    │
│ │ ─────────────────────           │    │
│ │                                 │    │
│ │ Ratings (8 of 12):              │    │
│ │ ✅ Skuli (A4F2) - 8.5 ⭐        │    │
│ │ ✅ Anna (B3K8) - 9.0 ⭐         │    │
│ │ ✅ Jon (C7M2) - 7.5 ⭐          │    │
│ │ ... (5 more)                    │    │
│ │                                 │    │
│ │ Pending (4):                    │    │
│ │ ⏳ Eiki (D9N5)                  │    │
│ │ ⏳ Maria (E1P3)                 │    │
│ │ ⏳ Olafur (F2Q6)                │    │
│ │ ⏳ Sara (G5R8)                  │    │
│ │                                 │    │
│ │ ─────────────────────           │    │
│ │                                 │    │
│ │ [Complete Tasting]              │    │
│ └─────────────────────────────────┘    │
└────────────────────────────────────────┘
```

**Note:** Export is NOT available during active tasting. Leaders can export results from the tasting card in the tasting list view (homepage or `/tastings`).

---

### 7.7) Scores Page (All Users)

```
┌────────────────────────────────────────┐
│ Friday Night Beers                      │
│ [Return to Tasting]                     │
│                                         │
│ ──────── Top Beers ────────             │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 🥇 IPA Sample                   │    │
│ │    Brewery A                    │    │
│ │    ⭐ 8.25 / 10 (12 ratings)    │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 🥈 Stout Special                │    │
│ │    Brewery B                    │    │
│ │    ⭐ 8.10 / 10 (11 ratings)    │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ 🥉 Lager Light                  │    │
│ │    Brewery C                    │    │
│ │    ⭐ 7.95 / 10 (12 ratings)    │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ Pilsner Gold                    │    │
│ │ Brewery D                       │    │
│ │ ⭐ 7.80 / 10 (10 ratings)       │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ... (all finished beers)                │
│                                         │
│ Updates live during active tasting      │
└────────────────────────────────────────┘
```

---

### 7.8) "Return to Tasting" Button Behavior

**Displays on:**
- Homepage (`/`)
- Tasting list (`/tastings`)
- Scores page (`/t/{id}/scores`)
- Admin pages (`/admin/*`)
- Any other tasting (`/t/{otherId}/*`)

**Does NOT display on:**
- Current tasting's rating view (`/t/{id}/rate`)
- Current tasting's admin tabs (`/t/{id}/admin/*`)

**Conditions:**
- Only shown if user has an active tasting session
- Stored in localStorage/cookie: `activeTastingId`
- Set when joining/creating a tasting
- Cleared when tasting is completed

**Appearance:**
- Mobile: Fixed bottom button, full-width
- Desktop: Floating button, bottom-right corner
- Text: "Return to Tasting →"

---

## 8) API Specification

### 8.1) Admin Endpoints

#### POST `/api/admin/auth`
Authenticate as admin.

**Request:**
```json
{
  "name": "admin"
}
```

**Response (200):**
```json
{
  "success": true
}
```
Sets httpOnly cookie: `admin_session=true`

**Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

#### GET `/api/admin/users`
List all users.

**Auth:** Admin session required

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Skuli",
      "isLeader": true,
      "createdAt": "2025-01-15T10:00:00Z",
      "tastingCount": 3,
      "ratingCount": 24
    },
    {
      "id": "uuid",
      "name": "Eiki",
      "isLeader": false,
      "createdAt": "2025-01-20T14:00:00Z",
      "tastingCount": 1,
      "ratingCount": 6
    }
  ]
}
```

---

#### PATCH `/api/admin/users/{userId}`
Update user (promote/demote leader).

**Auth:** Admin session required

**Request:**
```json
{
  "isLeader": true
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Eiki",
    "isLeader": true
  }
}
```

---

#### GET `/api/admin/tastings`
List all tastings (admin view).

**Auth:** Admin session required

**Response (200):**
```json
{
  "tastings": [
    {
      "id": "uuid",
      "title": "Friday Night Beers",
      "status": "active",
      "createdAt": "2025-01-15T18:00:00Z",
      "createdBy": "uuid",
      "createdByName": "Skuli",
      "participantCount": 12,
      "beerCount": 6,
      "ratingCount": 48
    }
  ]
}
```

---

### 8.2) Tasting Endpoints

#### GET `/api/tastings`
List all tastings (public, for selection).

**Response (200):**
```json
{
  "tastings": [
    {
      "id": "uuid",
      "title": "Friday Night Beers",
      "status": "active",
      "createdAt": "2025-01-15T18:00:00Z",
      "participantCount": 12,
      "beerCount": 6
    }
  ]
}
```

---

#### POST `/api/tastings`
Create new tasting.

**Request:**
```json
{
  "title": "Friday Night Beers",
  "creatorName": "Skuli"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Friday Night Beers",
  "status": "draft",
  "createdBy": "uuid",
  "participant": {
    "id": "uuid",
    "userId": "uuid",
    "code": "A4F2",
    "rejoinToken": "token",
    "isLeader": true
  }
}
```

---

#### GET `/api/tastings/{id}`
Get tasting details.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Friday Night Beers",
  "status": "active",
  "currentBeerId": "uuid",
  "version": 5,
  "createdAt": "2025-01-15T18:00:00Z",
  "beers": [
    {
      "id": "uuid",
      "name": "IPA Sample",
      "brewery": "Brewery A",
      "status": "finished",
      "orderIndex": 0,
      "averageRating": 8.25,
      "ratingCount": 12
    }
  ],
  "currentUserIsLeader": false
}
```

---

#### PATCH `/api/tastings/{id}`
Update tasting (start, close).

**Auth:** Leader required

**Request:**
```json
{
  "status": "active",  // or "closed"
  "userName": "Skuli"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "active",
  "version": 2
}
```

---

#### POST `/api/tastings/{id}/beers`
Add beer to tasting.

**Auth:** Leader required

**Request:**
```json
{
  "name": "IPA Sample",
  "brewery": "Brewery A",
  "style": "IPA",  // optional
  "abv": 6.5,      // optional
  "userName": "Skuli"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "IPA Sample",
  "brewery": "Brewery A",
  "status": "untasted",
  "orderIndex": 0
}
```

---

#### PATCH `/api/tastings/{id}/beers/{beerId}`
Edit beer.

**Auth:** Leader required

**Request:**
```json
{
  "name": "IPA Sample Updated",
  "brewery": "Brewery A",
  "userName": "Skuli"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "IPA Sample Updated",
  "brewery": "Brewery A"
}
```

---

#### DELETE `/api/tastings/{id}/beers/{beerId}`
Delete beer.

**Auth:** Leader required

**Constraints:**
- Only if `status = "untasted"`
- Only if no ratings exist

**Request:**
```json
{
  "userName": "Skuli"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Response (400):**
```json
{
  "error": "Cannot delete beer with ratings or in current/finished state"
}
```

---

#### PATCH `/api/tastings/{id}/current`
Set current beer.

**Auth:** Leader required

**Request:**
```json
{
  "beerId": "uuid",
  "userName": "Skuli"
}
```

**Response (200):**
```json
{
  "tastingId": "uuid",
  "currentBeerId": "uuid",
  "version": 6
}
```

---

#### POST `/api/tastings/{id}/beers/{beerId}/finish`
Mark beer as finished.

**Auth:** Leader required

**Request:**
```json
{
  "userName": "Skuli"
}
```

**Response (200):**
```json
{
  "beerId": "uuid",
  "status": "finished",
  "average": 8.25,
  "count": 12,
  "version": 7
}
```

---

#### POST `/api/tastings/{id}/complete`
Complete tasting (close).

**Auth:** Leader required

**Request:**
```json
{
  "userName": "Skuli"
}
```

**Response (200):**
```json
{
  "tastingId": "uuid",
  "status": "closed",
  "version": 8
}
```

---

### 8.3) Participant Endpoints

#### POST `/api/tastings/{id}/join`
Join tasting as participant.

**Request:**
```json
{
  "name": "Eiki"
}
```

**Response (200):**
```json
{
  "participantId": "uuid",
  "userId": "uuid",
  "rejoinToken": "token",
  "code": "D9N5",
  "isLeader": false,
  "user": {
    "id": "uuid",
    "name": "Eiki"
  }
}
```

Sets httpOnly cookie: `participant_token={rejoinToken}`

---

#### POST `/api/tastings/{id}/reclaim`
Reclaim participant session.

**Request:**
```json
{
  "rejoinToken": "token"
}
```

**Response (200):**
```json
{
  "participantId": "uuid",
  "userId": "uuid",
  "isLeader": false
}
```

**Response (404):**
```json
{
  "error": "Invalid or expired token"
}
```

---

### 8.4) Rating Endpoints

#### POST `/api/tastings/{id}/ratings`
Submit or update rating.

**Request:**
```json
{
  "beerId": "uuid",
  "participantId": "uuid",
  "score": 8.5
}
```

**Validation:**
- `score`: 1.0 to 10.0, step 0.5
- Beer must be current or finished (can't rate untasted beers)

**Response (200):**
```json
{
  "id": "uuid",
  "beerId": "uuid",
  "participantId": "uuid",
  "score": 8.5,
  "createdAt": "2025-01-15T18:30:00Z",
  "updatedAt": "2025-01-15T18:30:00Z"
}
```

---

#### GET `/api/tastings/{id}/current/pending-raters`
Get pending raters for current beer.

**Auth:** Leader required

**Response (200):**
```json
{
  "currentBeerId": "uuid",
  "totalParticipants": 12,
  "ratedCount": 8,
  "pendingCount": 4,
  "rated": [
    {
      "participantId": "uuid",
      "name": "Skuli",
      "code": "A4F2",
      "score": 8.5,
      "submittedAt": "2025-01-15T18:30:00Z"
    }
  ],
  "pending": [
    {
      "participantId": "uuid",
      "name": "Eiki",
      "code": "D9N5"
    }
  ]
}
```

---

### 8.5) Scores & Export Endpoints

#### GET `/api/tastings/{id}/scores`
Get scores page data.

**Response (200):**
```json
{
  "tastingId": "uuid",
  "title": "Friday Night Beers",
  "status": "active",
  "beers": [
    {
      "beerId": "uuid",
      "name": "IPA Sample",
      "brewery": "Brewery A",
      "average": 8.25,
      "count": 12,
      "status": "finished",
      "orderIndex": 0,
      "rank": 1
    }
  ]
}
```

---

#### GET `/api/tastings/{id}/leaderboard`
Get top finished beers (for waiting state).

**Response (200):**
```json
{
  "beers": [
    {
      "beerId": "uuid",
      "name": "IPA Sample",
      "brewery": "Brewery A",
      "average": 8.25,
      "count": 12,
      "rank": 1
    }
  ]
}
```

---

#### GET `/api/tastings/{id}/export?format=csv|xlsx`
Export tasting results.

**Query Params:**
- `format`: "csv" or "xlsx"

**Response (200):**
- Content-Type: `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="tasting-{id}-{date}.{format}"`

**CSV Structure:**

Section 1: Individual Ratings
```csv
Beer Name,Brewery,Participant,Code,Rating,Timestamp
IPA Sample,Brewery A,Skuli,A4F2,8.5,2025-01-15T18:30:00Z
IPA Sample,Brewery A,Eiki,D9N5,7.0,2025-01-15T18:31:00Z
```

Section 2: Summary
```csv
Beer Name,Brewery,Average Rating,Total Ratings,Status,Order
IPA Sample,Brewery A,8.25,12,finished,0
Stout Special,Brewery B,8.10,11,finished,1
```

**XLSX Structure:**
- Sheet 1: "Ratings" (individual ratings)
- Sheet 2: "Summary" (per-beer stats)

---

### 8.6) Real-time Endpoint

#### GET `/api/tastings/{id}/stream`
SSE stream for real-time updates.

**Response:** `text/event-stream`

**Event Types:**

```
event: currentChanged
data: {"tastingId":"uuid","currentBeerId":"uuid","version":6}

event: finished
data: {"tastingId":"uuid","beerId":"uuid","average":8.25,"count":12,"version":7}

event: scoresUpdated
data: {"tastingId":"uuid","version":7}

event: tastingClosed
data: {"tastingId":"uuid","status":"closed","version":8}
```

---

## 9) Real-time & State Management

### 9.1) Authoritative State
- Server is the single source of truth
- `Tasting.version` tracks state changes
- Clients must sync with server version

### 9.2) Delivery Mechanism

**Primary: Server-Sent Events (SSE)**
- One SSE connection per tasting: `GET /api/tastings/{id}/stream`
- Broadcasts events to all connected clients
- Auto-reconnects with exponential backoff (1s, 2s, 4s, max 10s)
- Drops connection after 3 failed reconnects → fallback to polling

**Fallback: Polling**
- Interval: 1 second
- Endpoint: `GET /api/tastings/{id}?version={clientVersion}`
- Server returns full state only if `serverVersion > clientVersion`
- Polling activates if SSE unavailable or after 3 reconnect failures

### 9.3) Client Synchronization Logic

```typescript
// Pseudo-code
const clientVersion = useRef(1);

// SSE event handler
sseConnection.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.version > clientVersion.current) {
    // Server is ahead, refetch state
    refetchTasting();
    clientVersion.current = data.version;
  }
};

// Polling fallback
setInterval(() => {
  const response = await fetch(`/api/tastings/${id}?version=${clientVersion.current}`);
  const data = await response.json();
  
  if (data.version > clientVersion.current) {
    // Update state
    updateTastingState(data);
    clientVersion.current = data.version;
  }
}, 1000);
```

### 9.4) State Change Events

| Event | Trigger | Increments Version | Broadcast |
|-------|---------|-------------------|-----------|
| **Current beer changed** | Leader selects new current beer | ✅ | `currentChanged` |
| **Beer finished** | Leader marks beer finished | ✅ | `finished` |
| **Tasting closed** | Leader completes tasting | ✅ | `tastingClosed` |
| **New rating** | Participant submits rating | ❌ | `scoresUpdated` |
| **Rating updated** | Participant edits rating | ❌ | `scoresUpdated` |

### 9.5) Consistency Target
- **With SSE:** All clients see state change within **≤1 second**
- **With polling:** All clients see state change within **≤2 seconds**

### 9.6) Optimistic Updates
- Client-side rating submissions use optimistic updates
- If server response fails, revert optimistic change and show error
- Re-sync on next SSE event or poll

### 9.7) Session Persistence

**Storage:**
```json
// httpOnly cookie (primary)
{
  "participant_token": "rejoinToken"
}

// localStorage (fallback)
{
  "activeTastingId": "uuid",
  "participantId": "uuid",
  "rejoinToken": "token",
  "userName": "Eiki",
  "isLeader": false
}
```

**Auto-reclaim flow:**
1. User visits `/t/{id}`
2. Check for cookie `participant_token`
3. If exists, call `POST /api/tastings/{id}/reclaim`
4. If successful, restore session silently
5. If failed, prompt for name entry

---

## 10) Authentication & Security

### 10.1) Admin Authentication

**Method:** Name-based (MVP simplicity)

**Flow:**
1. Admin visits `/admin`
2. Enters name: "admin"
3. Server checks: `name.toLowerCase() === 'admin'`
4. If valid: sets httpOnly cookie `admin_session=true` (24h expiry)
5. Redirects to `/admin/users`

**Middleware:**
```typescript
export function requireAdmin(req: Request) {
  const adminSession = req.cookies.get('admin_session');
  
  if (!adminSession || adminSession.value !== 'true') {
    throw new Error('Admin access required');
  }
}
```

**Production Enhancement (Future):**
- Hash admin password in `AdminAuth` table
- Use bcrypt for comparison
- Environment variable: `ADMIN_PASSWORD`

---

### 10.2) Leader Authorization

**Method:** User.isLeader flag check

**Flow:**
1. Leader joins tasting (like any participant)
2. System checks `User.isLeader` on join
3. If true: sets `isLeader: true` in response
4. Client stores leader status in localStorage
5. Leader sees extra UI controls

**Middleware:**
```typescript
export async function requireLeader(userName: string) {
  const user = await db.user.findUnique({
    where: { name: userName.toLowerCase() },
    select: { isLeader: true }
  });
  
  if (!user?.isLeader) {
    throw new Error('Leader access required');
  }
}
```

**API Enforcement:**
- All leader endpoints validate `userName` in request body
- Check if User exists and `isLeader = true`
- Return 403 if not authorized

---

### 10.3) Participant Authentication

**Method:** Rejoin token (UUID)

**Flow:**
1. On join: generate UUID, store as `Participant.rejoinToken`
2. Set httpOnly cookie: `participant_token={rejoinToken}`
3. On subsequent requests: validate token against DB
4. If valid: restore participant session

**Session Cookie:**
```typescript
cookies().set('participant_token', rejoinToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30  // 30 days
});
```

---

### 10.4) Security Measures

| Threat | Mitigation |
|--------|------------|
| **SQL Injection** | Prisma ORM (parameterized queries) |
| **XSS** | React automatic escaping, CSP headers |
| **CSRF** | SameSite cookies, Next.js built-in protection |
| **Session Hijacking** | httpOnly cookies, secure flag in production |
| **Brute Force** | No throttling in MVP (low-risk friend groups) |
| **Rating Spam** | Unique constraint: one rating per beer per participant |

---

### 10.5) Abuse Controls

**MVP Approach:**
- No rate limiting (simplicity for friend groups)
- Trust-based model
- Database constraints prevent duplicate ratings

**Future Enhancements:**
- Rate limiting: 10 requests/minute per IP
- CAPTCHA on join for public tastings
- Admin ability to ban participants

---

## 11) Accessibility & i18n

### 11.1) Accessibility Requirements

**WCAG 2.1 AA Compliance:**
- All interactive elements keyboard-navigable
- Focus indicators visible (2px outline)
- Color contrast ratio ≥4.5:1 for text
- Touch targets ≥44x44px on mobile
- Screen reader labels on all buttons/inputs
- ARIA landmarks for major sections

**Mobile-First Design:**
- Large tap targets (min 48px)
- Readable font sizes (16px minimum)
- High contrast mode support
- No hover-only interactions

**Form Accessibility:**
- Label elements linked to inputs
- Error messages in ARIA live regions
- Required fields marked with asterisk + aria-required
- Clear focus order (tab navigation)

**Dynamic Content:**
- ARIA live regions for real-time updates
- Polite announcements for non-critical updates
- Assertive announcements for critical updates (beer finished)

---

### 11.2) Internationalization

**MVP:** English only

**i18n Scaffolding (Optional):**
- Use `next-intl` or `react-i18next`
- Extract all UI strings to translation files
- Date/time formatting with `Intl.DateTimeFormat`

**Future Languages:**
- Icelandic (primary target)
- Danish, Norwegian, Swedish (Nordic expansion)

---

## 12) Performance Requirements

### 12.1) Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Mobile LCP** | < 2.0s | Lighthouse |
| **Mobile FID** | < 100ms | Web Vitals |
| **Mobile CLS** | < 0.1 | Web Vitals |
| **API Response (POST /ratings)** | p95 < 200ms | Server logs |
| **API Response (GET queries)** | p95 < 300ms | Server logs |
| **Real-time propagation** | ≤1s (SSE) / ≤2s (polling) | Manual testing |
| **Export generation** | ≤5s for 10k ratings | Load testing |

### 12.2) Optimization Strategies

**Frontend:**
- Code splitting per route
- Image optimization (Next.js Image)
- Lazy load non-critical components
- Debounce rating input (300ms)
- React Query caching (5min stale time)

**Backend:**
- Database indexes on frequently queried fields
- Pagination for large lists (20 items/page)
- Cached aggregate queries (scores page: 10s cache)
- Edge functions for geo-distributed API routes

**Network:**
- HTTP/2 server push for critical assets
- Gzip/Brotli compression
- CDN for static assets
- Service worker for offline static assets (optional)

---

### 12.3) Database Indexes

```prisma
// Critical indexes for performance
@@index([tastingId, status])  // Beer queries by status
@@index([tastingId, orderIndex])  // Beer ordering
@@index([beerId])  // Rating lookups
@@index([participantId])  // User rating history
@@index([rejoinToken])  // Session reclaim
@@index([name])  // User lookup by name
```

---

## 13) Observability

### 13.1) Error Tracking
**Tool:** Sentry

**Capture:**
- Frontend errors (React error boundaries)
- API errors (500s, unhandled exceptions)
- Failed SSE connections
- Database query failures

**Context:**
- User ID (if authenticated)
- Tasting ID (if applicable)
- Request path and method
- Browser/device info

---

### 13.2) Metrics

**Core Metrics:**
- `rating_submitted`: Counter (labels: tastingId, beerId)
- `beer_finished`: Counter (labels: tastingId, beerId)
- `current_beer_changed`: Counter (labels: tastingId)
- `tasting_created`: Counter
- `participant_joined`: Counter (labels: tastingId, isLeader)
- `sse_connection`: Gauge (active connections)
- `api_request_duration`: Histogram (labels: endpoint, method, status)

**Business Metrics:**
- Total tastings created
- Average participants per tasting
- Average beers per tasting
- Average ratings per beer
- Completion rate (draft → active → closed)

---

### 13.3) Logging

**Levels:**
- `ERROR`: Unhandled exceptions, failed requests
- `WARN`: SSE disconnections, failed retries
- `INFO`: State transitions, exports generated
- `DEBUG`: API calls, database queries (dev only)

**Structured Logging:**
```json
{
  "timestamp": "2025-01-15T18:30:00Z",
  "level": "INFO",
  "message": "Beer finished",
  "context": {
    "tastingId": "uuid",
    "beerId": "uuid",
    "average": 8.25,
    "ratingCount": 12
  }
}
```

---

## 14) Testing Strategy

### 14.1) Unit Tests
**Framework:** Vitest

**Coverage Targets:**
- Data validation: 100%
- Business logic: 90%
- Utils/helpers: 80%

**Key Test Areas:**
- Rating score validation (1.0-10.0, step 0.5)
- Upsert rating logic (create vs update)
- Average calculation (rounding to 2 decimals)
- User name normalization (case-insensitive)
- Participant code generation (unique, alphanumeric)

---

### 14.2) Integration Tests
**Framework:** Vitest + Supertest (API testing)

**Scenarios:**
1. Create tasting → add beers → start tasting
2. Join tasting → submit rating → verify upsert
3. Set current beer → finish beer → verify version increment
4. Complete tasting → verify no more ratings accepted
5. Export data → verify CSV/XLSX structure
6. Promote user → verify leader access on next join

---

### 14.3) End-to-End Tests
**Framework:** Playwright

**Critical Paths:**
1. **Admin promotes leader:**
   - Login as admin
   - Promote user
   - Verify leader flag

2. **Leader creates and manages tasting:**
   - Create tasting
   - Add beers
   - Start tasting
   - Set current beer
   - Verify participants see it

3. **Participant joins and rates:**
   - Join via link
   - Enter name
   - Submit rating
   - Edit rating
   - Verify saved

4. **Finish beer and show wrap-up:**
   - Leader finishes beer
   - Verify wrap-up shows for participants
   - Verify leaderboard appears after 5s
   - Leader selects next beer
   - Verify all clients update

5. **Export results:**
   - Generate CSV
   - Verify file downloads
   - Check file structure

**Run Frequency:**
- Pre-commit: None (too slow)
- Pre-push: Critical path only
- CI/CD: Full suite on main branch

---

### 14.4) Manual Testing Checklist

**Mobile (iOS/Android):**
- [ ] Responsive layouts at 375px, 414px, 768px
- [ ] Touch targets ≥48px
- [ ] Forms submit on Enter key
- [ ] No horizontal scroll
- [ ] SSE/polling works on mobile networks

**Real-time Sync:**
- [ ] Multiple devices see current beer change <1s
- [ ] Wrap-up shows on all participant devices
- [ ] Leaderboard updates live
- [ ] SSE reconnects after network loss

**Edge Cases:**
- [ ] Join with same name (case-insensitive)
- [ ] Rate non-current beer (should fail)
- [ ] Delete beer with ratings (should fail)
- [ ] Complete closed tasting (should fail)
- [ ] Rejoin after cookie cleared (should work)

---

## 15) Deployment & DevOps

### 15.1) Hosting

**Platform:** Vercel

**Deployment:**
- **Production:** `main` branch auto-deploys to vercel.app
- **Staging:** `develop` branch auto-deploys to staging.vercel.app
- **Preview:** Every PR gets preview URL

**Environment:**
- Node.js 20.x
- Next.js 15 (App Router)
- Edge Runtime for API routes where possible

---

### 15.2) Database

**Provider:** Neon (serverless Postgres) or Supabase

**Migrations:**
```bash
npx prisma migrate deploy  # Production
npx prisma migrate dev      # Development
```

**Backups:**
- **Staging:** Daily snapshots, 7-day retention
- **Production:** Daily snapshots, 30-day retention
- Manual backup before major migrations

**Connection Pooling:**
- Use Prisma Data Proxy or PgBouncer
- Max connections: 20 (Vercel serverless limit)

---

### 15.3) CI/CD Pipeline

**GitHub Actions:**

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Install dependencies
      - Run linter
      - Run unit tests
      - Run integration tests
      - Upload coverage

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - Checkout
      - Install dependencies
      - Run Playwright tests
      - Upload test results

  deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - Deploy to Vercel
      - Run smoke tests
      - Notify Slack
```

---

### 15.4) Monitoring

**Uptime Monitoring:**
- Vercel Analytics (built-in)
- Uptime check: `/api/health` endpoint (1min interval)

**Error Tracking:**
- Sentry (frontend + backend)
- Slack notifications for critical errors

**Performance:**
- Vercel Speed Insights
- Core Web Vitals dashboard

---

## 16) Definition of Done (MVP)

### 16.1) Functional Requirements

- [ ] **Admin can authenticate** and manage users
- [ ] **Admin can promote/demote** users to/from leader role
- [ ] **Leader can create tasting** with 3-click flow
- [ ] **Leader can add beers** with name and brewery
- [ ] **Leader can start tasting** (draft → active)
- [ ] **Leader can select current beer** from untasted list
- [ ] **Leader can finish beer** and trigger wrap-up
- [ ] **Leader can complete tasting** (active → closed)
- [ ] **Leader can export** data as CSV and XLSX
- [ ] **Leader can view pending raters** in real-time
- [ ] **Participant can join** via link with name
- [ ] **Participant can rate current beer** (1.0-10.0, step 0.5)
- [ ] **Participant can edit rating** until beer finished
- [ ] **Participant sees wrap-up screen** for ≥5s after finish
- [ ] **Participant sees leaderboard** of all finished beers
- [ ] **All clients see same current beer** within ≤1s (SSE) or ≤2s (polling)
- [ ] **Session persistence works** across refresh and device switch
- [ ] **"Return to Tasting" button** shows on all non-main pages
- [ ] **Scores page accessible** during and after tasting

---

### 16.2) Technical Requirements

- [ ] **20 concurrent participants** can rate without errors
- [ ] **SSE connection** works with auto-reconnect
- [ ] **Polling fallback** activates after 3 SSE failures
- [ ] **Database migrations** run successfully
- [ ] **Export generates** correct CSV/XLSX structure
- [ ] **All API endpoints** return correct status codes
- [ ] **Prisma schema** matches data model spec
- [ ] **httpOnly cookies** set for sessions

---

### 16.3) Quality Requirements

- [ ] **E2E happy path** green in CI
- [ ] **Unit test coverage** ≥80%
- [ ] **Mobile LCP** < 2.0s on 3G
- [ ] **No console errors** in production build
- [ ] **Lighthouse score** ≥90 (Performance, Accessibility)
- [ ] **Responsive design** works at 375px, 414px, 768px, 1024px
- [ ] **Keyboard navigation** works for all interactions
- [ ] **Screen reader** can navigate all pages

---

### 16.4) Documentation Requirements

- [ ] **README.md** with setup instructions
- [ ] **API documentation** (endpoints, requests, responses)
- [ ] **.env.example** with all required keys
- [ ] **Deployment guide** (Vercel + Neon/Supabase)
- [ ] **Admin guide** (how to promote leaders, manage users)

---

## 17) Risks & Mitigations

### 17.1) Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **SSE not supported on old browsers** | Low | Medium | Polling fallback (1s interval) |
| **Database connection limit (20)** | Medium | High | Use Prisma Data Proxy or PgBouncer |
| **Vercel Edge timeout (25s)** | Low | Medium | Keep API responses <10s; background jobs for exports >10s |
| **Real-time sync lag** | Medium | Medium | Target ≤1s; polling fallback if SSE fails |
| **Duplicate participants (same name)** | Medium | Low | Auto-rejoin via case-insensitive name match |
| **Lost admin access** | Low | High | Store admin password in .env; allow reset via DB script |

---

### 17.2) Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Too complex for non-tech users** | Low | High | 3-click tasting creation; no accounts |
| **Participants lose session on device switch** | Medium | Medium | Session persistence via rejoin token; auto-reclaim |
| **Leader forgets admin URL** | Medium | Medium | localStorage backup; prominent bookmark prompt |
| **Concurrent leader actions conflict** | Low | Medium | Last write wins; version control for sync |

---

### 17.3) Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Admin account compromise** | Low | High | Simple password for MVP; upgrade to bcrypt in v2 |
| **Session token theft** | Low | Medium | httpOnly cookies; secure flag in prod |
| **Rating spam** | Low | Low | Unique constraint; one rating per participant per beer |
| **GDPR non-compliance** | Low | Medium | Explicit "delete tasting" function removes all data |

---

## 18) Seed Data

### 18.1) Development Seed Script

```bash
npm run seed:dev
```

**Creates:**
- 1 Admin user (name: "admin")
- 3 Leader users (Skuli, Anna, Jon)
- 5 Participant users (Eiki, Maria, Olafur, Sara, Emma)
- 2 Tastings:
  1. "Friday Night Beers" (active, 6 beers, 20 participants, random ratings)
  2. "December Tasting" (closed, 8 beers, 15 participants, all rated)
- Total: ~240 ratings

**Sample Beers:**
1. IPA Sample - Brewery A (6.5% ABV)
2. Stout Special - Brewery B (8.0% ABV)
3. Lager Light - Brewery C (4.5% ABV)
4. Pilsner Gold - Brewery D (5.2% ABV)
5. Wheat Wonder - Brewery E (5.5% ABV)
6. Amber Ale - Brewery F (6.0% ABV)

---

## 19) Non-Functional Requirements

### 19.1) Reliability
- **Uptime:** 99.5% (excluding planned maintenance)
- **Data Durability:** Zero data loss (Postgres backups)
- **Graceful Degradation:** App remains functional if SSE fails (polling fallback)

### 19.2) Scalability
- **Concurrent Users:** 20 per tasting (MVP target)
- **Total Tastings:** Unlimited
- **Export Size:** ≤100k ratings per export (5s generation time)

### 19.3) Persistence
- **Completed tastings remain accessible** unless explicitly deleted by admin
- **Ratings cannot be deleted** (data integrity)
- **Users cannot be deleted** (maintains historical links)

### 19.4) Shareability
- **Results page viewable** by anyone with the link after tasting completion
- **Export files downloadable** by any leader of the tasting
- **Direct links** (`/t/{id}`) work for sharing

### 19.5) GDPR Compliance (Basic)
- **Right to erasure:** Admin can delete entire tasting (cascades to all ratings)
- **Data minimization:** Only essential data collected (name, ratings)
- **Transparency:** Clear messaging about what data is stored
- **No tracking:** No analytics cookies without consent

---

## 20) Environment Configuration

### 20.1) Required Environment Variables

```bash
# App Configuration
NEXT_PUBLIC_APP_NAME=BeerTasting
NEXT_PUBLIC_APP_URL=https://beerrating.app

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Admin Authentication (Optional - defaults to "admin")
ADMIN_PASSWORD=your_secure_password_here

# Export Configuration
EXPORT_MAX_ROWS=100000

# Real-time Configuration
REALTIME_MODE=sse   # sse|polling (default: sse)
SSE_RECONNECT_MAX_ATTEMPTS=3
POLLING_INTERVAL_MS=1000

# Session Configuration
SESSION_COOKIE_NAME=bt_participant
SESSION_COOKIE_MAX_AGE=2592000  # 30 days in seconds

# Wrap-up Configuration
WRAP_UP_DURATION_MS=5000  # 5 seconds minimum

# Monitoring (Optional)
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production

# Vercel (Auto-set by platform)
VERCEL_ENV=production
VERCEL_URL=auto-set-by-vercel
```

---

### 20.2) Example .env File

```bash
# .env.example
NEXT_PUBLIC_APP_NAME=BeerTasting
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/beertasting
ADMIN_PASSWORD=admin
EXPORT_MAX_ROWS=100000
REALTIME_MODE=sse
WRAP_UP_DURATION_MS=5000
SESSION_COOKIE_NAME=bt_participant
```

---

## 📋 Appendix: Quick Reference

### Key URLs

| URL | Purpose |
|-----|---------|
| `/` | Homepage (create or join tasting) |
| `/admin` | Admin login |
| `/admin/users` | User management |
| `/t/{id}` | Join tasting (public link) |
| `/t/{id}/rate` | Current beer rating view |
| `/t/{id}/scores` | Scores page (leaderboard) |
| `/t/{id}/admin` | Leader controls (tabs: Rate, Manage, Export) |