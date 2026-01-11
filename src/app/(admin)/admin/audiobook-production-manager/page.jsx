import { createClient } from "@/src/lib/supabase/server";
import ClientPage from "./ClientPage";

export default async function Page() {
  // 👇 ADD 'await' HERE
  const supabase = await createClient();

  const { data: bookings, error } = await supabase
    .from("2_booking_requests")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Supabase Error:", error);
  }

  return <ClientPage initialBookings={bookings || []} />;
}
