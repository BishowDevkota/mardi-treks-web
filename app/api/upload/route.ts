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

/** Extract the Cloudinary public_id from a Cloudinary URL */
function extractPublicId(url: string): string | null {
  // Cloudinary URL format: https://res.cloudinary.com/CLOUD_NAME/raw/upload/v1234567/FOLDER/FILENAME
  // The URL includes the file extension, but the public_id does NOT include it
  const match = url.match(/\/v\d+\/(.+?)(?:\.[^/.]+)?$/);
  return match ? match[1] : null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "mardi-treks";
    const oldPublicId = (formData.get("oldPublicId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // Delete the old file from Cloudinary before uploading the new one
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, { resource_type: "raw" });
        console.log(`Deleted old Cloudinary file: ${oldPublicId}`);
      } catch (deleteErr) {
        console.error("Failed to delete old Cloudinary file:", deleteErr);
      }
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

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let publicId = searchParams.get("publicId");

    // If no direct publicId, try extracting from the URL
    if (!publicId) {
      const url = searchParams.get("url");
      if (!url) {
        return NextResponse.json({ error: "Missing 'publicId' or 'url' query param" }, { status: 400 });
      }
      publicId = extractPublicId(url);
    }

    if (!publicId) {
      return NextResponse.json({ error: "Could not determine public ID" }, { status: 400 });
    }

    // Try raw first (for KML/GeoJSON), fall back to image
    let deleted = false;
    for (const resourceType of ["raw", "image"] as const) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        if (result.result === "ok" || result.result === "not found") {
          deleted = true;
          console.log(`Deleted Cloudinary file (${resourceType}): ${publicId} → ${result.result}`);
          break;
        }
      } catch {}
    }

    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
