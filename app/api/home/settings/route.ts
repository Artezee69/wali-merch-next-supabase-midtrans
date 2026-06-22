import { NextResponse } from "next/server";
import { getHomepageSettings } from "@/lib/storeSettings";

// Public endpoint that exposes the homepage settings bundle to the
// `useHomepageSettings` client hook (used by the Navbar). The route is
// intentionally not cached on the client (`cache: "no-store"` in the
// hook) and is not aggressively cached here either, so admin edits are
// reflected on the next page load.

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getHomepageSettings();
    return NextResponse.json(settings, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}
