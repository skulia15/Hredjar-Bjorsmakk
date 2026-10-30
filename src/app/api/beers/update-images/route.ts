import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authErrorResponse, requireLeader } from '@/lib/auth';

// POST /api/beers/update-images - Update beer images from Vínbúðin
export async function POST() {
  try {
    await requireLeader();

    // Find all beers with productNumbers but no imageUrl
    const beersToUpdate = await prisma.beer.findMany({
      where: {
        productNumber: { not: null },
        imageUrl: null
      }
    });

    console.log(`Found ${beersToUpdate.length} beers to update with images`);

    // Update each beer with the constructed image URL
    const updatePromises = beersToUpdate.map(beer => {
      if (!beer.productNumber) return null;

      const imageUrl = `https://www.vinbudin.is/Portaldata/1/Resources/vorumyndir/medium/${beer.productNumber}_r.jpg`;

      return prisma.beer.update({
        where: { id: beer.id },
        data: { imageUrl }
      });
    });

    const results = await Promise.all(updatePromises.filter(p => p !== null));

    return NextResponse.json({
      message: 'Beer images updated successfully',
      updated: results.length,
      total: beersToUpdate.length
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error updating beer images:', error);
    return NextResponse.json(
      { error: 'Failed to update beer images' },
      { status: 500 }
    );
  }
}

// GET /api/beers/update-images - Check how many beers need image updates
export async function GET() {
  try {
    const beersNeedingImages = await prisma.beer.count({
      where: {
        productNumber: { not: null },
        imageUrl: null
      }
    });

    const beersWithImages = await prisma.beer.count({
      where: {
        imageUrl: { not: null }
      }
    });

    return NextResponse.json({
      needingImages: beersNeedingImages,
      withImages: beersWithImages
    });
  } catch (error) {
    console.error('Error checking beer images:', error);
    return NextResponse.json(
      { error: 'Failed to check beer images' },
      { status: 500 }
    );
  }
}
