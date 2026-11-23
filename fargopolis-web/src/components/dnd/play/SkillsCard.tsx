import Character from "@/models/Character";
import { SkillsBlock } from "../SkillsBlock";
import { StatBox } from "../StatBox";

export const SkillsCard: React.FC<{ character: Character }> = ({ character }) => (
    <StatBox title="Skills">
        <SkillsBlock character={character} variant="compact" />
    </StatBox>
);
