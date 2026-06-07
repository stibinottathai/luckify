import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')
  
  if (host === 'luckify-sigma.vercel.app') {
    const url = request.nextUrl.clone()
    url.host = 'www.luckundo.xyz'
    url.port = ''
    return NextResponse.redirect(url, 301)
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
