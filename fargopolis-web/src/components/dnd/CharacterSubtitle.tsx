import { formatIndexName, formatRaceLabel } from "@/helpers/Format";
import Character from "@/models/Character";
import { Text } from "@chakra-ui/react";

interface CharacterSubtitleProps {
    character: Character;
}

/** "Wood Elf · Level 5 Ranger (Hunter)" — race/subrace, level, class and (muted) subclass. */
export const CharacterSubtitle: React.FC<CharacterSubtitleProps> = ({ character }) => {
    const subclass = formatIndexName(character.subclassName);

    return (
        <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="light" color="fg.secondary">
            {`${formatRaceLabel(character.race, character.subrace)} · Level ${character.level} ${formatIndexName(character.className)}`}
            {subclass && <Text as="span" color="fg.muted">{` (${subclass})`}</Text>}
        </Text>
    );
};
