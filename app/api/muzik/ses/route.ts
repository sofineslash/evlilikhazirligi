import { NextResponse } from "next/server";
import fs from "node:fs";
import { muzikDosyaYolu } from "@/lib/muzik";

export const dynamic = "force-dynamic";

function getMimeType(filePath: string): string {
  try {
    const fd = fs.openSync(filePath, "r");
    const header = Buffer.alloc(12);
    fs.readSync(fd, header, 0, 12, 0);
    fs.closeSync(fd);
    if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
      return "audio/wav";
    }
    if (header[0] === 0x4f && header[1] === 0x67 && header[2] === 0x67 && header[3] === 0x53) {
      return "audio/ogg";
    }
    if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
      return "audio/mp4";
    }
  } catch {}
  return "audio/mpeg";
}

/** Safari ve mobil istemcilerin Range desteğini kontrol ettiği HEAD isteği */
export async function HEAD() {
  const dosya = muzikDosyaYolu();
  if (!dosya) {
    return new NextResponse(null, { status: 404 });
  }
  const stat = fs.statSync(dosya);
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(stat.size),
      "Content-Type": getMimeType(dosya),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/**
 * Müzik dosyasını ses akışı olarak sunar.
 * iOS Safari ve Android Chrome için zorunlu olan HTTP 206 Partial Content (Range) destekler.
 */
export async function GET(req: Request) {
  const dosya = muzikDosyaYolu();
  if (!dosya) {
    return new NextResponse("Müzik dosyası bulunamadı", { status: 404 });
  }

  const stat = fs.statSync(dosya);
  const total = stat.size;
  const mime = getMimeType(dosya);
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

    if (isNaN(start) || start >= total || end >= total || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(dosya, { start, end });
    const readable = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new NextResponse(readable as any, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const stream = fs.createReadStream(dosya);
  const readable = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new NextResponse(readable as any, {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(total),
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
