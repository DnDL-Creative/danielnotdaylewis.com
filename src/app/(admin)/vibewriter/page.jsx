import { createClient } from "@/src/lib/supabase/server";
import ClientVibeWriter from "./ClientPage";

// Force dynamic rendering so data is always fresh on load
export const dynamic = "force-dynamic";

export default async function VibeWriterPage() {
  const supabase = await createClient();

  // Fetch initial drafts list server-side to prevent waterfall loading
  const { data: initialDrafts } = await supabase
    .from("posts")
    .select("id, title, date, slug, tag, published")
    .order("date", { ascending: false });

  // Pass data to Client Component
  return <ClientVibeWriter initialDrafts={initialDrafts || []} />;
}
