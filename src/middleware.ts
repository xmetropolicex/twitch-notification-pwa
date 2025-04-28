import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Giriş yapılmış mı kontrolünü tarayıcı tarafında yapıyoruz
  // Burada sadece /dashboard sayfası için bir yönlendirme örneği var
  // Gerçek kimlik doğrulama client-side yapılacak

  // Auth callback ve ana sayfa için middleware çalışmaz
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth/callback')
  ) {
    return NextResponse.next();
  }

  // Dashboard sayfasına erişmeye çalışan kullanıcılar için
  // Eğer dashboard'a gitmek istiyorsa, buraya geldi demektir
  // Kullanıcı giriş yapıp yapmadığını client-side'da kontrol edeceğiz
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};