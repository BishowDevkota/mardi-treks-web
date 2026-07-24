import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

// Secret to prevent unauthorized revalidation
// Set REVALIDATION_SECRET in environment variables
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!REVALIDATION_SECRET) {
      console.error("REVALIDATION_SECRET is not configured");
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    // Verify secret
    const authHeader = request.headers.get("authorization");
    const body = await request.json().catch(() => ({}));
    const { secret, path, tag } = body;

    const providedSecret = authHeader?.replace("Bearer ", "") || secret;

    if (providedSecret !== REVALIDATION_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    // Revalidate by path
    if (path) {
      revalidatePath(path, "page");
      return NextResponse.json({
        revalidated: true,
        path,
        message: `Revalidated path: ${path}`,
      });
    }

    // Revalidate by tag
    if (tag) {
      revalidateTag(tag, "default");
      return NextResponse.json({
        revalidated: true,
        tag,
        message: `Revalidated tag: ${tag}`,
      });
    }

    return NextResponse.json(
      { error: "Either 'path' or 'tag' is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
