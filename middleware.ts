// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // เช็คว่ามี session cookie หรือไม่
  const session = request.cookies.get('next-auth.session-token');
  
  // ถ้าเป็นหน้า /admin/* และไม่มี session → redirect ไป login
  if (request.nextUrl.pathname.startsWith('/admin') && !session) {
    const loginUrl = new URL('/api/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

// กำหนดว่า middleware ให้ทำงานเฉพาะ path ที่ต้องการ
export const config = {
  matcher: ['/admin/:path*'],
};