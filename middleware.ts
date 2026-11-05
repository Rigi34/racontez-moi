import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lien d'email périmé ou remplacé par un plus récent : Supabase renvoie vers
  // l'accueil avec ?error_code=…, sans aucune explication à l'écran (constat
  // du 05/11/2026). On l'amène sur la connexion, qui affiche le message.
  if (pathname === "/" && request.nextUrl.searchParams.has("error_code")) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.search = "?error=lien"
    url.hash = ""
    return NextResponse.redirect(url)
  }

  const isProtected =
    pathname.startsWith("/tableau-de-bord") ||
    pathname.startsWith("/seance")

  if (!isProtected) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let hasUser = false
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (!error && data?.claims?.sub) {
      hasUser = true
    } else {
      const result = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
      ])
      hasUser = !!result.data.user
    }
  } catch {
    hasUser = false
  }

  if (!hasUser) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("redirect_url", pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/", "/tableau-de-bord/:path*", "/seance/:path*"],
}
