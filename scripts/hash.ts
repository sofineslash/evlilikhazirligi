/**
 * Admin sifresi icin bcrypt hash uretir (base64 kodlu).
 *
 *   npm run hash -- 'yeni-sifreniz'
 *
 * Cikan satiri .env.local'e (yerel) ya da GitHub secret'ina (uretim) koy.
 * Base64 kodlu, cunku bcrypt hash'i $ karakteri iceriyor ve docker compose
 * onu degisken referansi sanip bozuyor.
 */
import bcrypt from "bcryptjs";

const sifre = process.argv[2];
if (!sifre) {
  console.error("Kullanim: npm run hash -- 'sifreniz'");
  process.exit(1);
}
if (sifre.length < 8) {
  console.error("Sifre en az 8 karakter olmali.");
  process.exit(1);
}

const hash = bcrypt.hashSync(sifre, 12);
const b64 = Buffer.from(hash).toString("base64");

console.log("\nADMIN_PASSWORD_HASH_B64=" + b64 + "\n");
console.log("Dogrulama:", bcrypt.compareSync(sifre, hash) ? "OK" : "HATA");
