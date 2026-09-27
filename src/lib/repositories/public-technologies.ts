import "server-only";

import { createPublicClient } from "@/lib/supabase/public";

export type PublicTechnologyGroup = { id: string; name: string; technologies: string[] };

type MemberLink = { display_order: number; technologies: { name: string } | null };

/**
 * Active groups with their active technologies, in display order. RLS hides
 * inactive groups and members whose technology is inactive.
 */
export async function listPublicTechnologyGroups(): Promise<PublicTechnologyGroup[]> {
  const { data, error } = await createPublicClient()
    .from("technology_groups")
    .select("id, name, technology_group_members(display_order, technologies(name))")
    .order("display_order")
    .order("name");
  if (error) throw new Error(`listPublicTechnologyGroups: ${error.message}`);
  return (data ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    technologies: [...(group.technology_group_members as MemberLink[])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((member) => member.technologies?.name)
      .filter((name): name is string => Boolean(name))
  }));
}
