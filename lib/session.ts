import { SignJWT, jwtVerify } from "jose";
import { CFG } from "./config";

function anahtar(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET tanimli degil veya 32 karakterden kisa (.env.local)");
  }
  return new TextEncoder().encode(s);
}

/** Admin oturumu. `nesil` claim'i ile toplu iptal edilebilir (E19). */
export async function adminJetonuUret(nesil: number): Promise<string> {
  return new SignJWT({ rol: "admin", nesil })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CFG.OTURUM_GUN}d`)
    .sign(anahtar());
}

export async function adminJetonuDogrula(jwt: string | undefined, nesil: number) {
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, anahtar());
    if (payload.rol !== "admin") return null;
    if (payload.nesil !== nesil) return null; // nesil artirilinca tum oturumlar duser
    return payload;
  } catch {
    return null;
  }
}

/** Cihaz jetonu — imzali, tahmin edilemez. Hiz siniri ve "Bilgimi duzelt" icin. */
export async function cihazJetonuUret(): Promise<string> {
  return new SignJWT({ tur: "cihaz", r: crypto.randomUUID() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(anahtar());
}

export async function cihazJetonuDogrula(jwt: string | undefined | null) {
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, anahtar());
    return payload.tur === "cihaz" ? jwt : null;
  } catch {
    return null;
  }
}
