import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create products directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'products');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/products/${uniqueName}`,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

