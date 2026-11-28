import { SKILLS } from "@/constants/Skills";
import { withStatDefaults } from "@/helpers/CharacterStats";
import Character from "@/models/Character";
import { Button } from "@chakra-ui/react";
import { useState } from "react";
import { SkillsBlock } from "../SkillsBlock";
import { StatBox } from "../StatBox";

/** Play sidebar Skills card: compact chips, with the proficient-only / show-all toggle in the card header. */
export const SkillsCard: React.FC<{ character: Character }> = ({ character }) => {
    const [showAll, setShowAll] = useState(false);
    const proficiencies = withStatDefaults(character).skillProficiencies;
    const hasProficient = SKILLS.some(s => proficiencies.includes(s.key));

    return (
        <StatBox
            title="Skills"
            headerRight={hasProficient ? (
                <Button variant="ghost" size="xs" px="1" h="6" minH="0" color="brand" onClick={() => setShowAll(v => !v)}>
                    {showAll ? "Proficient only" : `Show all ${SKILLS.length}`}
                </Button>
            ) : undefined}
        >
            <SkillsBlock character={character} variant="compact" showAll={hasProficient ? showAll : true} />
        </StatBox>
    );
};
