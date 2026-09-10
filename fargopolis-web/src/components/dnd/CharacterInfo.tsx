import { getLevelInfoForClass, LevelInfo } from "@/api/dnd5eapi";
import { MOBILE_BREAK } from "@/constants/Media";
import Character from "@/models/Character";
import { Box, NativeSelect, Tabs, Text, useMediaQuery } from "@chakra-ui/react";
import { useState } from "react";
import useSWR from "swr";
import { LoadingWrapper } from "../ui/LoadingWrapper";
import { StyledAccordion } from "../ui/StyledAccordion";
import { CharacterResources } from "./CharacterResources";
import { ClassFeatures } from "./class/ClassFeatures";
import { RacialTraits } from "./race/RacialTraits";
import { SpellInfo } from "./spells/SpellInfo";
import { WeaponInfo } from "./weapons/WeaponInfo";
import { AbilityInfo } from "./abilities/AbilityInfo";

interface CharacterInfoProps {
    character: Character;
}

export const CharacterInfo: React.FC<CharacterInfoProps> = ({ character }) => {
    const { data: levelInfos, isLoading: isLoadingClassInfo } = useSWR<LevelInfo[]>(`/class/${character.className}/levels`, () => getLevelInfoForClass(character.className));
    const [value, setValue] = useState('1');

    const [isMobile] = useMediaQuery([`(max-width: ${MOBILE_BREAK})`], { fallback: [false] });
    const characterTabs = [
        { label: "Info", value: "1" },
        { label: "Spells", value: "2" },
        { label: "Abilities", value: "3" },
        { label: "Items", value: "4" },
    ];

    return <LoadingWrapper isLoading={isLoadingClassInfo}>
        <Tabs.Root value={value} onValueChange={(e) => setValue(e.value)}>
            <Box borderBottomWidth="1px" borderColor="border.DEFAULT" display="flex" justifyContent="center">
                {isMobile
                    ? <NativeSelect.Root>
                        <NativeSelect.Field value={value} onChange={(e) => setValue(e.target.value)}>
                            {characterTabs.map((tab) => (
                                <option key={tab.value} value={tab.value}>{tab.label}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    : <Tabs.List aria-label="Character tabs">
                        {characterTabs.map((tab) => (
                            <Tabs.Trigger key={tab.value} value={tab.value}>{tab.label}</Tabs.Trigger>
                        ))}
                    </Tabs.List>}
            </Box>
            <Tabs.Content value="1">
                <Box>
                    <StyledAccordion title="Class Features">
                        <ClassFeatures
                            currentLevel={character.level}
                            className={character.className}
                            characterId={character.characterId}
                        />
                    </StyledAccordion>

                    <StyledAccordion title="Racial Traits">
                        <RacialTraits
                            race={character.race}
                            characterId={character.characterId}
                        />
                    </StyledAccordion>

                    <StyledAccordion title="Proficiencies">
                        <Text>No proficiencies yet!</Text>
                    </StyledAccordion>

                    <StyledAccordion title="Resources">
                        <CharacterResources characterId={character.characterId} />
                    </StyledAccordion>
                </Box>
            </Tabs.Content>
            <Tabs.Content value="2">
                <SpellInfo levelInfos={levelInfos} currentLevel={character.level} className={character.className} characterId={character.characterId} />
            </Tabs.Content>
            <Tabs.Content value="3">
                <AbilityInfo characterId={character.characterId} canEdit={true} />
            </Tabs.Content>
            <Tabs.Content value="4">
                <WeaponInfo characterId={character.characterId} />
            </Tabs.Content>
        </Tabs.Root>
    </LoadingWrapper>
}
