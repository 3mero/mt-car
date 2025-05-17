import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Puedes agregar lógica de middleware aquí si es necesario
  // Por ejemplo, redirecciones, autenticación, etc.
  return NextResponse.next()
}
