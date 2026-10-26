import type { SectionId } from "@/data/types";
import { getEnabledSections } from "@/lib/content";

import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { CaseStudySection } from "@/components/sections/CaseStudySection";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { EducationSection } from "@/components/sections/EducationSection";
import { Contact } from "@/components/sections/Contact";

/**
 * The home page.
 *
 * The page does not hardcode its own order. It walks
 * `siteConfig.sections` and renders the matching component, so reordering or
 * removing a section is a one-line change in `src/data/site-config.ts` and
 * never a change here.
 */
const SECTION_COMPONENTS: Record<SectionId, () => React.JSX.Element | null> = {
  hero: Hero,
  about: About,
  experience: ExperienceSection,
  "case-study": CaseStudySection,
  projects: Projects,
  skills: Skills,
  education: EducationSection,
  contact: Contact,
};

export default function HomePage() {
  const sections = getEnabledSections();

  return (
    <>
      {sections.map((id) => {
        const Component = SECTION_COMPONENTS[id];
        return Component ? <Component key={id} /> : null;
      })}
    </>
  );
}
