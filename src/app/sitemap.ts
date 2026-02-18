import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BASE_URL = "https://danielnotdaylewis.com";

// Use a lightweight Supabase client for sitemap generation (no auth/cookies needed)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${BASE_URL}/actor`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/collab`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/endeavors`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
    ];

    // Dynamic blog posts from Supabase
    let blogPages: MetadataRoute.Sitemap = [];
    try {
        const { data: posts } = await supabase
            .from("posts")
            .select("slug, created_at")
            .eq("published", true);

        if (posts) {
            blogPages = posts.map((post) => ({
                url: `${BASE_URL}/blog/${post.slug}`,
                lastModified: post.created_at
                    ? new Date(post.created_at)
                    : new Date(),
                changeFrequency: "monthly" as const,
                priority: 0.6,
            }));
        }
    } catch (error) {
        console.error("Sitemap: Failed to fetch blog posts", error);
    }

    return [...staticPages, ...blogPages];
}
