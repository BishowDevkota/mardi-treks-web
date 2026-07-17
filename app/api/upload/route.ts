import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { v2 as cloudinary } from "cloudinary";
import { DOMParser } from "@xmldom/xmldom";
import { kml } from "@tmcw/togeojson";

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
    const fileName = file.name.toLowerCase();

    // Detect file types
    const isJson = fileName.endsWith(".json") || fileName.endsWith(".geojson");
    const isKml = fileName.endsWith(".kml");

    // Process content: for KML, convert to GeoJSON
    let content: string | null = null;
    if (isKml) {
      try {
        const kmlText = buffer.toString("utf-8");
        const dom = new DOMParser().parseFromString(kmlText, "text/xml");
        const geoJson = kml(dom);
        content = JSON.stringify(geoJson);
      } catch (parseErr: any) {
        console.error("KML parse error:", parseErr);
        return NextResponse.json({ error: `Failed to parse KML: ${parseErr.message}` }, { status: 400 });
      }
    } else if (isJson) {
      try {
        content = buffer.toString("utf-8");
        JSON.parse(content); // validate it's valid JSON
      } catch {
        return NextResponse.json({ error: "Invalid GeoJSON/JSON file" }, { status: 400 });
      }
    }

    // Upload to Cloudinary (raw for route files, auto for images)
    let result: any = null;
    let url = "";
    let publicId = "";
    try {
      const resourceType = isJson || isKml ? "raw" : "auto";
      const tmpDir = path.join(os.tmpdir(), "mardi-uploads");
      await mkdir(tmpDir, { recursive: true });
      const tmpPath = path.join(tmpDir, file.name);
      await writeFile(tmpPath, buffer);
      result = await cloudinary.uploader.upload(tmpPath, {
        folder,
        resource_type: resourceType,
      });
      try { await import("fs/promises").then((f) => f.unlink(tmpPath)); } catch {}
      url = result.secure_url;
      publicId = result.public_id;
      if ((isJson || isKml) && url) {
        url = url.replace("/image/upload/", "/raw/upload/");
      }
    } catch (cloudErr: any) {
      console.error("Cloudinary upload error:", cloudErr);
      // If Cloudinary fails, still return the parsed content for inline use
      // so the map can still display the route even without cloud storage
    }

    return NextResponse.json({
      publicId,
      url,
      content, // will be GeoJSON whether input was .json, .geojson, or .kml
      width: result?.width,
      height: result?.height,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
