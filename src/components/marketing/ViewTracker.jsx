"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";

export default function ViewTracker({ slug }) {
  const hasFired = useRef(false);

  useEffect(() => {
    // 1. Prevent React Strict Mode double-firing
    if (hasFired.current) return;
    hasFired.current = true;

    const trackView = async () => {
      // 2. Bot Protection (Don't count Google/Bing bots)
      if (typeof navigator !== "undefined") {
        const ua = navigator.userAgent || "";
        const isBot =
          /bot|google|baidu|bing|msn|duckduckgo|teoma|slurp|yandex|spider|crawl|curl/i.test(
            ua
          );
        if (isBot) return;
      }

      try {
        const supabase = createClient();

        // 3. AUTH CHECK (The Critical Step)
        // We check if a user is currently logged in.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // IF YOU ARE LOGGED IN (ADMIN), WE STOP HERE.
        // The view will NOT be counted.
        if (session) {
          console.log("Admin view detected - ignoring increment.");
          return;
        }

        // 4. If we made it here, it's a real visitor. Increment the view.
        const { error } = await supabase.rpc("increment_view", {
          page_slug: slug,
        });

        if (error) {
          console.error("Supabase RPC Error:", error.message);
        } else {
          console.log("View incremented for:", slug);
        }
      } catch (err) {
        console.error("Tracker Error:", err);
      }
    };

    trackView();
  }, [slug]);

  return null;
}
