import { createClient } from "@/src/utils/supabase/server";
import HomeUI from "@/src/app/(marketing)/_components/HomeUI";

export default async function Home() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true);

  return <HomeUI initialPosts={posts || []} />;
}
