import type { Metadata } from "next";
import { getPageContent, DEFAULT_ABOUT_CONTENT } from "@/lib/page-content";
import { AboutBlocksRenderer } from "@/components/about/AboutBlocksRenderer";

export const metadata: Metadata = { title: "Our Story" };

export default async function AboutPage() {
  const content = await getPageContent("about", DEFAULT_ABOUT_CONTENT);
  return <AboutBlocksRenderer rows={content.rows} />;
}
