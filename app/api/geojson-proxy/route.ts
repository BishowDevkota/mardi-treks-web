import { NextResponse } from "next/server";
import { gunzip, inflate, inflateRaw } from "zlib";

// Try all three decompression methods in order until one works
async function decompress(buffer: Buffer): Promise<Buffer> {
  for (const method of [gunzip, inflate, inflateRaw]) {
    try {
      return await new Promise<Buffer>((resolve, reject) => {
        method(buffer, (err: Error | null, result: Buffer) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    } catch {}
  }
  throw new Error("Could not decompress — not gzip, zlib, or deflate format");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let requestedUrl: URL;
  try {
    requestedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const allowedHosts = new Set(["geojson.io", "res.cloudinary.com"]);
  if (requestedUrl.protocol !== "https:" || !allowedHosts.has(requestedUrl.hostname)) {
    return NextResponse.json({ error: "URL host is not allowed" }, { status: 403 });
  }

  // ── Handle geojson.io share URLs ──────────────────────────────────
  // geojson.io encodes GeoJSON as base64 → deflate-compressed data in the URL
  if (url.includes("geojson.io") && url.includes("data=")) {
    try {
      const parsed = requestedUrl;
      let encoded = parsed.searchParams.get("data") || "";
      // Strip optional gz: prefix from geojson.io
      if (encoded.startsWith("gz:")) encoded = encoded.slice(3);
      // Decode base64url → standard base64 → buffer → inflate → string
      const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const compressed = Buffer.from(base64, "base64");
      const decompressed = await decompress(compressed);
      const geoJson = decompressed.toString("utf-8");

      // Validate it's valid GeoJSON
      const parsed2 = JSON.parse(geoJson);
      if (!parsed2.type) throw new Error("Not a GeoJSON object");

      return new NextResponse(geoJson, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Source": "geojson.io-decode",
        },
      });
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to decode geojson.io data: ${err.message}` }, { status: 502 });
    }
  }

  // ── Regular URL fetch ─────────────────────────────────────────────
  // Try the given URL first. If it fails (old Cloudinary image URL format),
  // also try the /raw/upload/ variant.
  const urlsToTry = [url];
  if (url.includes("/image/upload/")) {
    urlsToTry.push(url.replace("/image/upload/", "/raw/upload/"));
  }

  let lastError = "No URLs could be fetched";

  for (const tryUrl of urlsToTry) {
    try {
      const res = await fetch(tryUrl, {
        headers: { "User-Agent": "MardiTreks/1.0" },
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }

      const text = await res.text();

      // Validate it's actually JSON
      try {
        JSON.parse(text);
      } catch {
        lastError = "Response is not valid GeoJSON";
        continue;
      }

      return new NextResponse(text, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err: any) {
      lastError = err.message;
      continue;
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 });
}
