import ExcelJS from 'exceljs';
import { prisma } from './prisma';
import { format as formatDate } from 'date-fns';
import { flavorTagLabel } from './flavorTags';

export type ExportFormat = 'csv' | 'xlsx';

/**
 * Generate export file for a tasting
 */
export async function generateTastingExport(tastingId: string, formatType: ExportFormat): Promise<Buffer> {
  // Fetch all tasting data with related information
  const tasting = await prisma.tasting.findUnique({
    where: { id: tastingId },
    include: {
      tastingBeers: {
        include: {
          beer: true,  // Include catalog beer if referenced
          flavorTags: { select: { participantId: true, tags: true } },
          ratings: {
            include: {
              participant: {
                include: { user: true }
              }
            },
            orderBy: { createdAt: 'asc' }
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
  workbook.creator = 'Hreðjar Bjórsmakk App';
  workbook.created = new Date();

  // Sheet 1: Individual Ratings
  const ratingsSheet = workbook.addWorksheet('Ratings');

  // Style the header row
  ratingsSheet.columns = [
    { header: 'Beer Name', key: 'beerName', width: 30 },
    { header: 'Brewery', key: 'brewery', width: 30 },
    { header: 'Participant', key: 'participant', width: 20 },
    { header: 'Code', key: 'code', width: 10 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Tags', key: 'tags', width: 30 },
    { header: 'Note', key: 'note', width: 50 },
    { header: 'Group Guess', key: 'groupGuess', width: 12 },
    { header: 'Timestamp', key: 'timestamp', width: 25 },
  ];

  // Make header row bold
  ratingsSheet.getRow(1).font = { bold: true };
  ratingsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add rating data
  tasting.tastingBeers.forEach(tb => {
    const beerName = tb.beer?.name || tb.customName || 'Unknown';
    const brewery = tb.beer?.brewery || tb.customBrewery || 'Unknown';
    // Tags are saved apart from the rating, so match them up by participant
    const tagsByParticipant = new Map(tb.flavorTags.map(ft => [ft.participantId, ft.tags]));

    tb.ratings.forEach(rating => {
      ratingsSheet.addRow({
        beerName,
        brewery,
        participant: rating.participant.user?.name || `Notandi ${rating.participant.code}`,
        code: rating.participant.code,
        rating: rating.score,
        tags: (tagsByParticipant.get(rating.participantId) ?? []).map(flavorTagLabel).join(', '),
        note: rating.note ?? '',
        groupGuess: rating.groupGuess ?? '',
        timestamp: formatDate(rating.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      });
    });
  });

  // Sheet 2: Summary
  const summarySheet = workbook.addWorksheet('Summary');

  summarySheet.columns = [
    { header: 'Rank', key: 'rank', width: 8 },
    { header: 'Beer Name', key: 'beerName', width: 30 },
    { header: 'Brewery', key: 'brewery', width: 30 },
    { header: 'Average Rating', key: 'average', width: 15 },
    { header: 'Total Ratings', key: 'count', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Order', key: 'order', width: 8 },
  ];

  // Make header row bold
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Calculate averages and sort by average descending
  const beerSummaries = tasting.tastingBeers.map(tb => {
    const ratings = tb.ratings;
    const average = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

    return {
      name: tb.beer?.name || tb.customName || 'Unknown',
      brewery: tb.beer?.brewery || tb.customBrewery || 'Unknown',
      average,
      count: ratings.length,
      status: tb.status,
      orderIndex: tb.orderIndex
    };
  });

  // Sort by average descending
  beerSummaries.sort((a, b) => b.average - a.average);

  // Add summary data with ranks
  beerSummaries.forEach((beer, index) => {
    const row = summarySheet.addRow({
      rank: index + 1,
      beerName: beer.name,
      brewery: beer.brewery,
      average: beer.average.toFixed(2),
      count: beer.count,
      status: beer.status,
      order: beer.orderIndex + 1,
    });

    // Highlight top 3
    if (index < 3 && beer.count > 0) {
      const colors = ['FFD4AF37', 'FFC0C0C0', 'FFCD7F32']; // Gold, Silver, Bronze
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors[index] }
      };
    }
  });

  // Add tasting info sheet
  const infoSheet = workbook.addWorksheet('Info');
  infoSheet.columns = [
    { header: 'Property', key: 'property', width: 25 },
    { header: 'Value', key: 'value', width: 40 }
  ];

  infoSheet.getRow(1).font = { bold: true };

  infoSheet.addRow({ property: 'Tasting Name', value: tasting.title });
  infoSheet.addRow({ property: 'Status', value: tasting.status });
  infoSheet.addRow({ property: 'Total Beers', value: tasting.tastingBeers.length });
  infoSheet.addRow({ property: 'Total Ratings', value: tasting.tastingBeers.reduce((sum, tb) => sum + tb.ratings.length, 0) });
  infoSheet.addRow({ property: 'Created', value: formatDate(tasting.createdAt, 'yyyy-MM-dd HH:mm:ss') });
  infoSheet.addRow({ property: 'Exported', value: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss') });

  // Generate file based on format
  if (formatType === 'csv') {
    // For CSV, export only the ratings sheet
    return Buffer.from(await workbook.csv.writeBuffer());
  } else {
    // For XLSX, export the full workbook
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}

/**
 * Get content type for export format
 */
export function getExportContentType(format: ExportFormat): string {
  return format === 'csv'
    ? 'text/csv'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

/**
 * Get filename for export
 */
export function getExportFilename(tastingTitle: string, format: ExportFormat): string {
  const sanitized = tastingTitle
    .toLowerCase()
    // Transliterate Icelandic letters that NFD can't decompose, then strip accents
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = formatDate(new Date(), 'yyyy-MM-dd');

  return `${sanitized}-${timestamp}.${format}`;
}
