import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  // /login y /recuperar-acceso son las únicas páginas accesibles sin sesión.
  const isPublicPage = pathname === "/login" || pathname === "/recuperar-acceso";

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (isLoggedIn && isPublicPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Contraseña temporal vigente (alta de portal, reset de Admin o
  // solicitud de recuperación atendida) — no se deja usar el resto de la
  // app hasta que la reemplace por una propia.
  if (
    isLoggedIn &&
    req.auth?.user.debeCambiarPassword &&
    pathname !== "/cambiar-password" &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/cambiar-password", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
