import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary }          from 'cloudinary';
import { verifyAccessToken }          from '@/lib/auth';

// SDK auto-reads CLOUDINARY_URL from environment — no manual config needed

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyAccessToken(authHeader.split(' ')[1]);
    if (!payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Size limit: 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
    }

    // Convert File to base64 data URI
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder:         'bengalhomestay/listings',
      resource_type:  'image',
      transformation: [
        { width: 1280, height: 960, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
      ],
    });

    return NextResponse.json({
      url:      result.secure_url,
      publicId: result.public_id,
      width:    result.width,
      height:   result.height,
    });
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[POST /api/upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
