"use client";

import { useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";

export default function ViewCounter({ slug }) {
  useEffect(() => {
    const incrementView = async () => {
      // 1. CHECK FOR BOTS
      if (typeof navigator === "undefined") return;
      const isBot =
        /bot|google|baidu|bing|msn|duckduckgo|teoma|slurp|yandex|spider|crawl|curl/i.test(
          navigator.userAgent
        );

      if (isBot) return;

      // 2. INIT SUPABASE
      const supabase = createClient();

      // --- NEW STEP: CHECK FOR LOGGED IN USER ---
      // We check if a session exists.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If a user is found (you are logged in), we STOP here.
      if (user) {
        // console.log("Admin logged in. View not counted.");
        return;
      }

      // 3. IF NOT A BOT & NOT LOGGED IN, COUNT THE VIEW
      const { error } = await supabase.rpc("increment_view", {
        page_slug: slug,
      });

      if (error) {
        console.error("Error incrementing view:", error);
      }
    };

    if (slug) {
      incrementView();
    }
  }, [slug]);

  return null;
}
