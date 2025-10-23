import { NextRequest } from 'next/server';
import { sseManager } from '@/lib/sse';

// GET /api/tastings/[id]/stream - SSE stream for real-time updates
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add connection to SSE manager
      sseManager.addConnection(params.id, controller);

      // Send initial connection message
      const connectMessage = `event: connected\ndata: ${JSON.stringify({
        type: 'connected',
        tastingId: params.id,
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (error) {
          // Connection closed, clear interval
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Client disconnected from tasting ${params.id}`);
        clearInterval(pingInterval);
        sseManager.removeConnection(params.id, controller);
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
