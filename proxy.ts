import { NextResponse, type NextRequest } from "next/server";
import { cihazJetonuUret, cihazJetonuDogrula } from "./lib/session";

export const config = {
  // Acik matcher. /api/yukle/* ve statik varliklar disarida.
  matcher: ["/", "/an", "/tesekkurler", "/api/katilim"],
};

const CEREZ = "nisan_cihaz";

export async function proxy(req: NextRequest) {
  const mevcut = await cihazJetonuDogrula(req.cookies.get(CEREZ)?.value);
  const jeton = mevcut ?? (await cihazJetonuUret());

  /*
   * KRITIK (E6): jetonu yalnizca yanita koymak yetmez. Onu YARATAN istekte
   * handler cerezi goremez — cunku Set-Cookie yanitta gider. Ilk sayfa
   * gorunumu Pages'te oldugu icin davetlinin ILK tunellenen istegi zaten
   * RSVP POST'udur. O yuzden istege de enjekte ediyoruz.
   */
  const baslik = new Headers(req.headers);
  baslik.set("x-cihaz", jeton);

  const res = NextResponse.next({ request: { headers: baslik } });

  if (!mevcut) {
    res.cookies.set(CEREZ, jeton, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }

  // Tum site indekslenmesin. robots.txt'te blanket Disallow YOK —
  // ikisi birlikte birbirini iptal eder (engellenen crawler noindex'i gormez).
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noimageindex");
  return res;
}
