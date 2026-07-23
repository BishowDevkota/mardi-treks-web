import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteFile } from "@/lib/cloudinary";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publicId } = await req.json();
    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    await deleteFile(publicId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
