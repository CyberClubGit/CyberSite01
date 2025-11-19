// src/app/api/cors-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
        return new NextResponse(response.statusText, { status: response.status });
    }

    // Recrée une nouvelle réponse pour pouvoir streamer le corps et copier les en-têtes
    const headers = new Headers(response.headers);
    // Permet au client de savoir de quel type de contenu il s'agit
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    
    // Le corps est un flux (stream), on ne peut le lire qu'une fois
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

  } catch (error) {
    console.error('CORS Proxy Error:', error);
    return new NextResponse('Failed to fetch the target URL', { status: 500 });
  }
}
