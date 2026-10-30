import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTastingExport, getExportContentType, getExportFilename, type ExportFormat } from '@/lib/export';
import { authErrorResponse, requireLeader } from '@/lib/auth';

// GET /api/tastings/[id]/export?format=csv|xlsx - Export tasting results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get format from query params
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'xlsx') as ExportFormat;
    // Verify format
    if (format !== 'csv' && format !== 'xlsx') {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv or xlsx' },
        { status: 400 }
      );
    }

    // Verify user is leader
    await requireLeader();

    // Get tasting to verify it exists and get title
    const tasting = await prisma.tasting.findUnique({
      where: { id },
      select: { title: true }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Generate export file
    const buffer = await generateTastingExport(id, format);
    const filename = getExportFilename(tasting.title, format);
    const contentType = getExportContentType(format);

    // Return file as download
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error exporting tasting:', error);
    return NextResponse.json(
      { error: 'Failed to export tasting' },
      { status: 500 }
    );
  }
}
