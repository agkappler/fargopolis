import { AbilityInfo } from "./abilities/AbilityInfo";
import { KnownSpellsDisplay } from "./spells/KnownSpellsDisplay";
import { WeaponInfo } from "./weapons/WeaponInfo";
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, MenuItem, Select, Tab, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { MOBILE_BREAK } from "@/constants/Media";

interface ActionInfoProps {
    characterId: string;
    className: string;
}

export const ActionInfo: React.FC<ActionInfoProps> = ({ characterId, className }) => {
    const [value, setValue] = useState('1');
    const handleChange = (_: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };
    const isMobile = useMediaQuery(`(max-width:${MOBILE_BREAK})`);

    const actionTabs = [
        { label: "Weapons", value: "1" },
        { label: "Abilities", value: "2" },
        { label: "Spells", value: "3" },
    ];

    return (
        <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
                {isMobile ? (
                    <Select value={value} onChange={(e) => setValue(e.target.value)}>
                        {actionTabs.map((tab) => (
                            <MenuItem key={tab.value} value={tab.value}>
                                {tab.label}
                            </MenuItem>
                        ))}
                    </Select>
                ) : (
                    <TabList onChange={handleChange} aria-label="action tabs">
                        {actionTabs.map((tab) => (
                            <Tab key={tab.value} label={tab.label} value={tab.value} />
                        ))}
                    </TabList>
                )}
            </Box>
            <TabPanel value="1">
                <WeaponInfo characterId={characterId} canEdit={false} />
            </TabPanel>
            <TabPanel value="2">
                <AbilityInfo characterId={characterId} canEdit={false} />
            </TabPanel>
            <TabPanel value="3">
                <KnownSpellsDisplay
                    characterId={characterId}
                    className={className}
                    canEdit={false}
                />
            </TabPanel>
        </TabContext>
    );
};
