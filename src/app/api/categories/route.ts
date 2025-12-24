import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to expected format
    const transformedCategories = categories.map(cat => ({
      name: cat.name,
      subcategories: cat.subcategories.map(sub => sub.name),
    }));

    return NextResponse.json({ success: true, categories: transformedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
