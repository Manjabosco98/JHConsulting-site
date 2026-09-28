import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { publicImageUrl } from "@/lib/storage/images";

export type PublicProjectSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  shortDescription: string;
  problem: string;
  solution: string;
  featured: boolean;
  coverUrl: string | null;
  technologies: string[];
};

export type PublicProject = PublicProjectSummary & {
  description: string;
  repositoryUrl: string | null;
  demoUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

// RLS already limits rows to published, non-archived projects and their visible
// technologies; these selects never expose drafts.
const summarySelect =
  "id, slug, title, category, status, short_description, problem, solution, featured, cover_image, display_order, created_at, project_technologies(display_order, technologies(name))";

type TechnologyLink = { display_order: number; technologies: { name: string } | null };

function orderedTechnologies(links: TechnologyLink[] | null): string[] {
  return [...(links ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((link) => link.technologies?.name)
    .filter((name): name is string => Boolean(name));
}

function toSummary(row: {
  id: string; slug: string; title: string; category: string; status: string;
  short_description: string; problem: string; solution: string; featured: boolean;
  cover_image: string | null; project_technologies: TechnologyLink[] | null;
}): PublicProjectSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    shortDescription: row.short_description,
    problem: row.problem,
    solution: row.solution,
    featured: row.featured,
    coverUrl: publicImageUrl(row.cover_image),
    technologies: orderedTechnologies(row.project_technologies)
  };
}

/** Published projects in display order. Throws on error so callers can decide to fall back. */
export async function listPublishedProjects(): Promise<PublicProjectSummary[]> {
  const { data, error } = await createPublicClient()
    .from("projects")
    .select(summarySelect)
    .order("display_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listPublishedProjects: ${error.message}`);
  return (data ?? []).map(toSummary);
}

export async function getPublishedProjectBySlug(slug: string): Promise<PublicProject | null> {
  const { data, error } = await createPublicClient()
    .from("projects")
    .select(`${summarySelect}, description, repository_url, demo_url, published_at, updated_at`)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getPublishedProjectBySlug: ${error.message}`);
  if (!data) return null;
  return {
    ...toSummary(data),
    description: data.description,
    repositoryUrl: data.repository_url,
    demoUrl: data.demo_url,
    publishedAt: data.published_at,
    updatedAt: data.updated_at
  };
}

/** Slugs of published projects, for generateStaticParams and the sitemap. Never throws. */
export async function listPublishedProjectSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const { data, error } = await createPublicClient()
      .from("projects")
      .select("slug, updated_at")
      .order("display_order");
    if (error) throw error;
    return (data ?? []).map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
  } catch (error) {
    console.error(`[public-projects] slugs: ${(error as Error).message}`);
    return [];
  }
}
