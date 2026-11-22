import { AbilityInfo } from "./abilities/AbilityInfo";
import { KnownSpellsDisplay } from "./spells/KnownSpellsDisplay";
import { WeaponInfo } from "./weapons/WeaponInfo";
import { SkillsBlock } from "./SkillsBlock";
import { Box, NativeSelect, Tabs, useMediaQuery } from "@chakra-ui/react";
import { useState } from "react";
import { MOBILE_BREAK } from "@/constants/Media";
import Character from "@/models/Character";

interface ActionInfoProps {
    character: Character;
}

export const ActionInfo: React.FC<ActionInfoProps> = ({ character }) => {
    const [value, setValue] = useState('1');
    const [isMobile] = useMediaQuery([`(max-width: ${MOBILE_BREAK})`], { fallback: [false] });

    const actionTabs = [
        { label: "Weapons", value: "1" },
        { label: "Abilities", value: "2" },
        { label: "Spells", value: "3" },
        { label: "Skills", value: "4" },
    ];

    return (
        <Tabs.Root value={value} onValueChange={(e) => setValue(e.value)}>
            <Box borderBottomWidth="1px" borderColor="border" display="flex" justifyContent="center">
                {isMobile ? (
                    <NativeSelect.Root>
                        <NativeSelect.Field value={value} onChange={(e) => setValue(e.target.value)}>
                            {actionTabs.map((tab) => (
                                <option key={tab.value} value={tab.value}>{tab.label}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                ) : (
                    <Tabs.List aria-label="action tabs">
                        {actionTabs.map((tab) => (
                            <Tabs.Trigger key={tab.value} value={tab.value}>{tab.label}</Tabs.Trigger>
                        ))}
                    </Tabs.List>
                )}
            </Box>
            <Tabs.Content value="1">
                <WeaponInfo characterId={character.characterId} canEdit={false} />
            </Tabs.Content>
            <Tabs.Content value="2">
                <AbilityInfo characterId={character.characterId} canEdit={false} />
            </Tabs.Content>
            <Tabs.Content value="3">
                <KnownSpellsDisplay
                    characterId={character.characterId}
                    className={character.className}
                    canEdit={false}
                />
            </Tabs.Content>
            <Tabs.Content value="4">
                <SkillsBlock character={character} />
            </Tabs.Content>
        </Tabs.Root>
    );
};
