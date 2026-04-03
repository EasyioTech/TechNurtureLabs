import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    'google-site-verification: googlee5648d55f5ef2561',
    {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
