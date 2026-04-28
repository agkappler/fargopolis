import { getLevelInfoForClass, LevelInfo } from "@/api/dnd5eapi";
import { MOBILE_BREAK } from "@/constants/Media";
import Character from "@/models/Character";
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, MenuItem, Select, Tab, Typography, useMediaQuery } from "@mui/material";
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
    const handleChange = (_: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    const isMobile = useMediaQuery(`(max-width:${MOBILE_BREAK})`);
    const characterTabs = [
        { label: "Info", value: "1" },
        { label: "Spells", value: "2" },
        { label: "Abilities", value: "3" },
        { label: "Items", value: "4" },
    ];

    return <LoadingWrapper isLoading={isLoadingClassInfo}>
        <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
                {isMobile
                    ? <Select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    >
                        {characterTabs.map((tab) => (
                            <MenuItem key={tab.value} value={tab.value}>{tab.label}</MenuItem>
                        ))}
                    </Select>
                    : <TabList onChange={handleChange} aria-label="Character tabs">
                        {characterTabs.map((tab) => (
                            <Tab key={tab.value} label={tab.label} value={tab.value} />
                        ))}
                    </TabList>}
            </Box>
            <TabPanel value="1">
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
                        <Typography>No proficiencies yet!</Typography>
                    </StyledAccordion>

                    <StyledAccordion title="Resources">
                        <CharacterResources characterId={character.characterId} />
                    </StyledAccordion>
                </Box>
            </TabPanel>
            <TabPanel value="2">
                <SpellInfo levelInfos={levelInfos} currentLevel={character.level} className={character.className} characterId={character.characterId} />
            </TabPanel>
            <TabPanel value="3">
                <AbilityInfo characterId={character.characterId} canEdit={true} />
            </TabPanel>
            <TabPanel value="4">
                <WeaponInfo characterId={character.characterId} />
            </TabPanel>
        </TabContext>
    </LoadingWrapper>
}