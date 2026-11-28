import { getClass } from "@/api/dnd5eapi";
import { AbilityKey, SKILLS, SkillKey } from "@/constants/Skills";
import useSWR from "swr";

/**
 * A class's fixed saving-throw proficiencies and the pool of skills it can choose from,
 * used to prefill/scope the Combat step. `skillOptions` falls back to every skill until
 * the class is known, so the dropdown stays usable before a class is picked.
 */
export function useClassProficiencies(className?: string) {
    const { data } = useSWR(
        className ? `/classes/${className}` : null,
        () => getClass(className as string),
    );

    const savingThrows = data?.saving_throws.map(s => s.index as AbilityKey);

    const skillChoice = data?.proficiency_choices.find(c => c.from.options.some(o => o.item.index.startsWith("skill-")));
    const skillOptions: SkillKey[] = skillChoice
        ? SKILLS.filter(s => skillChoice.from.options.some(o => o.item.index === s.apiIndex)).map(s => s.key)
        : SKILLS.map(s => s.key);

    return { savingThrows, skillOptions, skillChooseCount: skillChoice?.choose };
}
