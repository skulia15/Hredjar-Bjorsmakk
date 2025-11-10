/**
 * Server-Sent Events (SSE) Manager
 * Manages real-time connections for tasting updates
 */

export type SSEEventType = 'currentChanged' | 'finished' | 'scoresUpdated' | 'tastingClosed' | 'connected' | 'nudge';

export interface SSEEventData {
  type: SSEEventType;
  tastingId: string;
  version?: number;
  [key: string]: unknown;
}

/**
 * SSE Manager - Singleton to manage all SSE connections
 */
class SSEManager {
  private connections: Map<string, Set<ReadableStreamDefaultController>> = new Map();

  /**
   * Add a new connection for a tasting
   */
  addConnection(tastingId: string, controller: ReadableStreamDefaultController) {
    if (!this.connections.has(tastingId)) {
      this.connections.set(tastingId, new Set());
    }
    this.connections.get(tastingId)!.add(controller);
    console.log(`[SSE] Connection added for tasting ${tastingId}. Total: ${this.connections.get(tastingId)!.size}`);
  }

  /**
   * Remove a connection for a tasting
   */
  removeConnection(tastingId: string, controller: ReadableStreamDefaultController) {
    const connections = this.connections.get(tastingId);
    if (connections) {
      connections.delete(controller);
      console.log(`[SSE] Connection removed for tasting ${tastingId}. Remaining: ${connections.size}`);

      if (connections.size === 0) {
        this.connections.delete(tastingId);
        console.log(`[SSE] No more connections for tasting ${tastingId}`);
      }
    }
  }

  /**
   * Broadcast an event to all connections for a tasting
   */
  broadcast(tastingId: string, event: SSEEventType, data: Record<string, unknown>) {
    const connections = this.connections.get(tastingId);
    if (!connections || connections.size === 0) {
      console.log(`[SSE] No connections to broadcast to for tasting ${tastingId}`);
      return;
    }

    const payload = {
      ...data,
      tastingId,
      type: event,
      timestamp: new Date().toISOString()
    };

    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    let successCount = 0;
    let errorCount = 0;

    connections.forEach((controller) => {
      try {
        controller.enqueue(encoded);
        successCount++;
      } catch (error) {
        console.error(`[SSE] Error sending message to connection:`, error);
        errorCount++;
        // Remove dead connections
        this.removeConnection(tastingId, controller);
      }
    });

    console.log(`[SSE] Broadcasted ${event} to tasting ${tastingId}. Success: ${successCount}, Errors: ${errorCount}`);
  }

  /**
   * Get number of active connections for a tasting
   */
  getConnectionCount(tastingId: string): number {
    return this.connections.get(tastingId)?.size ?? 0;
  }

  /**
   * Get total number of active connections
   */
  getTotalConnections(): number {
    let total = 0;
    this.connections.forEach((connections) => {
      total += connections.size;
    });
    return total;
  }

  /**
   * Get all tastings with active connections
   */
  getActiveTastings(): string[] {
    return Array.from(this.connections.keys());
  }
}

// Export singleton instance
export const sseManager = new SSEManager();

/**
 * Helper to broadcast tasting version update
 */
export function broadcastVersionUpdate(tastingId: string, version: number) {
  sseManager.broadcast(tastingId, 'scoresUpdated', { version });
}

/**
 * Helper to broadcast current beer changed
 */
export function broadcastCurrentBeerChanged(tastingId: string, beerId: string | null, version: number) {
  sseManager.broadcast(tastingId, 'currentChanged', {
    currentBeerId: beerId,
    version
  });
}

/**
 * Helper to broadcast beer finished
 */
export function broadcastBeerFinished(tastingId: string, beerId: string, average: number, count: number, version: number) {
  sseManager.broadcast(tastingId, 'finished', {
    beerId,
    average,
    count,
    version
  });
}

/**
 * Helper to broadcast tasting closed
 */
export function broadcastTastingClosed(tastingId: string, version: number) {
  sseManager.broadcast(tastingId, 'tastingClosed', {
    status: 'closed',
    version
  });
}

/**
 * Helper to broadcast nudge notification to pending participants
 */
export function broadcastNudge(tastingId: string, pendingParticipantIds: string[]) {
  sseManager.broadcast(tastingId, 'nudge', {
    pendingParticipantIds,
    message: 'Drífa sig!'
  });
}
