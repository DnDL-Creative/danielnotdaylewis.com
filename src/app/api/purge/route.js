import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request) {
  // Option 1: Purge just the homepage
  revalidatePath("/");

  // Option 2: Purge the entire site (if everything is nested under the root layout)
  revalidatePath("/", "layout");

  return NextResponse.json({
    revalidated: true,
    message: "Cache cleared for all users",
    timestamp: Date.now(),
  });
}
