import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { ADMIN_ROLES } from '@/lib/permissions';
import type { Role } from '@/types/auth.types';

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'student-companion-dev-secret',
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — não precisam de autenticação
  if (pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as Role;

    if (!ADMIN_ROLES.includes(role)) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('admin_token');
      return response;
    }

    return NextResponse.next();
  } catch {
    // Token inválido ou expirado
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Aplica middleware em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
