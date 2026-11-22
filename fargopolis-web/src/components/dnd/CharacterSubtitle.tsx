import { capitalize } from "@/helpers/Format";
import Character from "@/models/Character";
import { Text } from "@chakra-ui/react";

interface CharacterSubtitleProps {
    character: Character;
}

export const CharacterSubtitle: React.FC<CharacterSubtitleProps> = ({ character }) => {
    const race = character.subrace
        ? `${capitalize(character.race)} (${capitalize(character.subrace)})`
        : capitalize(character.race);

    return (
        <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="light" color="fg.secondary">
            {`${race}, Level ${character.level} ${capitalize(character.className)}`}
        </Text>
    );
};
