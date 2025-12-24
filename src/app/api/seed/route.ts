import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint seeds the database - use once after deployment
// Visit: https://your-site.vercel.app/api/seed?secret=darshan2026

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple protection - change this secret!
  if (secret !== 'darshan2026') {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await prisma.session.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productSize.deleteMany();
    await prisma.productColor.deleteMany();
    await prisma.product.deleteMany();
    await prisma.subcategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();

    // Create categories
    await prisma.category.create({
      data: {
        name: 'Sarees',
        subcategories: {
          create: [
            { name: 'Silk Sarees' },
            { name: 'Cotton Sarees' },
            { name: 'Banarasi Sarees' },
            { name: 'Designer Sarees' },
            { name: 'Wedding Sarees' },
          ],
        },
      },
    });

    await prisma.category.create({
      data: {
        name: 'Suits',
        subcategories: {
          create: [
            { name: 'Anarkali Suits' },
            { name: 'Salwar Suits' },
            { name: 'Palazzo Suits' },
            { name: 'Churidar Suits' },
            { name: 'Party Wear Suits' },
          ],
        },
      },
    });

    await prisma.category.create({
      data: {
        name: 'Kurtis',
        subcategories: {
          create: [
            { name: 'Cotton Kurtis' },
            { name: 'Printed Kurtis' },
            { name: 'Embroidered Kurtis' },
            { name: 'Party Wear Kurtis' },
            { name: 'Casual Kurtis' },
          ],
        },
      },
    });

    // Create sample products
    const products = [
      {
        name: 'Royal Kanjeevaram Silk Saree',
        description: 'Elegant pure Kanjeevaram silk saree with intricate golden zari work.',
        price: 8999,
        originalPrice: 12999,
        category: 'Sarees',
        subcategory: 'Silk Sarees',
        featured: true,
        newArrival: false,
        rating: 4.8,
        reviews: 124,
        images: ['/products/kurti-golden-print.jpg'],
        sizes: ['Free Size'],
        colors: [{ name: 'Maroon', hex: '#800000' }],
      },
      {
        name: 'Golden Block Print Kurti',
        description: 'Elegant cream kurti with beautiful golden block print design.',
        price: 1299,
        originalPrice: 1799,
        category: 'Kurtis',
        subcategory: 'Printed Kurtis',
        featured: true,
        newArrival: true,
        rating: 4.7,
        reviews: 86,
        images: ['/products/kurti-golden-print.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Cream', hex: '#FFFDD0' }],
      },
      {
        name: 'Patchwork Cotton Kurti',
        description: 'Trendy patchwork kurti with colorful geometric patterns.',
        price: 999,
        originalPrice: 1499,
        category: 'Kurtis',
        subcategory: 'Cotton Kurtis',
        featured: true,
        newArrival: true,
        rating: 4.5,
        reviews: 124,
        images: ['/products/kurti-patchwork.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Multi Color', hex: '#FFD700' }],
      },
      {
        name: 'Elegant Anarkali Suit',
        description: 'Beautiful Lucknowi chikankari Anarkali suit with delicate embroidery.',
        price: 4599,
        originalPrice: 5999,
        category: 'Suits',
        subcategory: 'Anarkali Suits',
        featured: true,
        newArrival: true,
        rating: 4.6,
        reviews: 112,
        images: ['/products/kurti-paisley.jpg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'White', hex: '#FFFFFF' }],
      },
    ];

    for (const p of products) {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice,
          category: p.category,
          subcategory: p.subcategory,
          featured: p.featured,
          newArrival: p.newArrival,
          rating: p.rating,
          reviews: p.reviews,
          images: { create: p.images.map((url) => ({ url })) },
          sizes: { create: p.sizes.map((size) => ({ size })) },
          colors: { create: p.colors },
        },
      });
    }

    // Create Admin user
    await prisma.user.create({
      data: {
        email: 'admin@darshan.com',
        name: 'Admin User',
        phone: '+91 98765 43210',
        password: 'admin123',
        role: 'ADMIN',
      },
    });

    // Create Demo Customer
    await prisma.user.create({
      data: {
        email: 'user@darshan.com',
        name: 'Demo Customer',
        phone: '+91 87654 32109',
        password: 'user123',
        role: 'CUSTOMER',
      },
    });

    return NextResponse.json({
      success: true,
      message: '🎉 Database seeded successfully!',
      data: {
        categories: 3,
        products: products.length,
        users: 2,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}

