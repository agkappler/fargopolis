import { ImageBox } from "@/components/ui/ImageBox";
import { capitalize } from "@/helpers/Format";
import Character from "@/models/Character";
import { Box, Flex, Text } from "@chakra-ui/react";

interface CharacterSubtitleProps {
    character: Character;
}

export const CharacterSubtitle: React.FC<CharacterSubtitleProps> = ({ character }) => {
    const race = character.subrace
        ? `${capitalize(character.race)} (${capitalize(character.subrace)})`
        : capitalize(character.race);

    return (
        <Flex direction="column" align="center" gap="2" py="4">
            {character.avatarId ? (
                <ImageBox fileId={character.avatarId} altText="Character avatar" />
            ) : (
                <Box boxSize="100px" borderRadius="full" bg="bg.sunk" border="1px solid" borderColor="border" aria-hidden="true" />
            )}
            <Text as="h2" textStyle="display-title" fontSize={{ base: "xl", sm: "2xl" }} color="fg" m="0" textAlign="center">
                {character.name}
            </Text>
            <Text fontSize="md" fontWeight="light" color="fg.secondary" textAlign="center">
                {`${race}, Level ${character.level} ${capitalize(character.className)}`}
            </Text>
        </Flex>
    );
};
