import { createClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";
import ClientVoiceoverTracker from "./ClientPage";

export const dynamic = "force-dynamic"; // Ensures data is always fresh

export default async function VoiceoverTrackerPage() {
  const cookieStore = cookies();

  // FIX: Added 'await' here because createClient is likely async
  const supabase = await createClient(cookieStore);

  // Fetch initial data on the server
  const { data: initialItems, error } = await supabase
    .from("11_voiceover_tracker")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching initial data:", error);
  }

  return <ClientVoiceoverTracker initialItems={initialItems || []} />;
}
