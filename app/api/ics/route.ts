import { CFG } from "@/lib/config";

export const dynamic = "force-dynamic";

function ts(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET() {
  const bitis = new Date(Date.parse(CFG.TARIH) + 4 * 60 * 60 * 1000).toISOString();
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nisan//TR",
    "BEGIN:VEVENT",
    `UID:${Date.parse(CFG.TARIH)}@kubranur.omuroz.com.tr`,
    `DTSTAMP:${ts(new Date().toISOString())}`,
    `DTSTART:${ts(CFG.TARIH)}`,
    `DTEND:${ts(bitis)}`,
    `SUMMARY:${CFG.GELIN} & ${CFG.DAMAT} Nisan`,
    `LOCATION:${CFG.SALON_AD}\\, ${CFG.SALON_ADRES}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nisan.ics"',
    },
  });
}
