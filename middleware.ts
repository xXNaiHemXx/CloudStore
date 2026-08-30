// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // ⚠️ ปิด hard redirect ชั่วคราว เพราะ getToken() บนเซิร์ฟยังหา cookie ไม่เจอ
  // (ปัญหา NEXTAUTH_URL/cookie ที่ยังแก้ไม่จบ) ทำให้ admin จริงเข้าไม่ได้
  // ตอนนี้การกันหน้า /admin เหลือแค่ชั้น client:
  //   - components/AdminGuard.js (เช็ค session + /api/admin/check-admin)
  //   - ปุ่ม Admin ใน profile.jsx ที่ซ่อนไว้สำหรับคนไม่ใช่ admin
  // TODO: แก้ปัญหา NEXTAUTH_URL/cookie ให้จบแล้วเปิด redirect นี้กลับมา
  //
  // const token = await getToken({
  //   req: request,
  //   secret: process.env.NEXTAUTH_SECRET,
  // });
  //
  // if (request.nextUrl.pathname.startsWith('/admin') && !token) {
  //   const loginUrl = new URL('/api/auth/signin', request.url);
  //   loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};