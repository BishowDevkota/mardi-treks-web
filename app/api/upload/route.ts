import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "mardi-treks";

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tmpDir = path.join(os.tmpdir(), "mardi-uploads");
    await mkdir(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, file.name);
    await writeFile(tmpPath, buffer);

    // Detect JSON/GeoJSON files — upload as raw so the URL serves raw content
    const isJson = file.name.endsWith(".json") || file.name.endsWith(".geojson");
    const resourceType = isJson ? "raw" : "auto";

    const result = await cloudinary.uploader.upload(tmpPath, {
      folder,
      resource_type: resourceType,
    });

    // Cleanup
    try { await import("fs/promises").then((f) => f.unlink(tmpPath)); } catch {}

    // For raw uploads, Cloudinary returns the wrong URL format — fix it
    let url = result.secure_url;
    if (isJson && url) {
      url = url.replace("/image/upload/", "/raw/upload/");
    }

    return NextResponse.json({
      publicId: result.public_id,
      url,
      content: isJson ? buffer.toString("utf-8") : null,
      width: result.width,
      height: result.height,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
