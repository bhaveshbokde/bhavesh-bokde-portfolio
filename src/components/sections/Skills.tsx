import { getSkillGroupsWithContext } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SkillsExplorer } from "@/components/ui/SkillsExplorer";

/**
 * Technical skills.
 *
 * The groups — and therefore the filter chips — are computed from
 * `src/data/skills.ts`. Add a category and a chip appears; hide every skill in
 * a category and both the group and its chip disappear. There is no list of
 * categories in any component.
 *
 * There are no percentage bars, star ratings or "expert / intermediate"
 * levels, because none of them would survive a follow-up question in an
 * interview.
 */
export function Skills() {
  const groups = getSkillGroupsWithContext();
  if (groups.length === 0) return null;

  const total = groups.reduce((count, group) => count + group.skills.length, 0);

  return (
    <Section
      id="skills"
      eyebrow="05 — Skills"
      title="Technical skills"
      description={
        <>
          {total} technologies across {groups.length} areas. A marker shows the
          ones the day job puts into production; everything else is listed
          without a claim attached, because a number next to a skill is a
          number somebody made up.
        </>
      }
    >
      <SkillsExplorer groups={groups} />
    </Section>
  );
}
