import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTastingExport, getExportContentType, getExportFilename, type ExportFormat } from '@/lib/export';
import { requireLeader } from '@/lib/auth';

// GET /api/tastings/[id]/export?format=csv|xlsx - Export tasting results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get format from query params
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'xlsx') as ExportFormat;
    const userName = searchParams.get('userName');

    if (!userName) {
      return NextResponse.json(
        { error: 'userName query parameter required' },
        { status: 400 }
      );
    }

    // Verify format
    if (format !== 'csv' && format !== 'xlsx') {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv or xlsx' },
        { status: 400 }
      );
    }

    // Verify user is leader
    await requireLeader(userName);

    // Get tasting to verify it exists and get title
    const tasting = await prisma.tasting.findUnique({
      where: { id: params.id },
      select: { title: true }
    });

    if (!tasting) {
      return NextResponse.json(
        { error: 'Tasting not found' },
        { status: 404 }
      );
    }

    // Generate export file
    const buffer = await generateTastingExport(params.id, format);
    const filename = getExportFilename(tasting.title, format);
    const contentType = getExportContentType(format);

    // Return file as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Leader access required') {
      return NextResponse.json(
        { error: 'Leader access required' },
        { status: 403 }
      );
    }

    console.error('Error exporting tasting:', error);
    return NextResponse.json(
      { error: 'Failed to export tasting' },
      { status: 500 }
    );
  }
}
