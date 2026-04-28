import useSWR from "swr";
import { Box, Typography, Grid } from "@mui/material";
import { useState } from "react";
import RequestManager from "@/helpers/RequestManager";
import Weapon from "@/models/Weapon";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { AddModelCard } from "../../ui/AddModelCard";
import { WeaponForm } from "./WeaponForm";
import { WeaponCard } from "./WeaponCard";

interface WeaponInfoProps {
    characterId: string;
    canEdit?: boolean;
}

export const WeaponInfo: React.FC<WeaponInfoProps> = ({ characterId, canEdit = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedWeapon, setSelectedWeapon] = useState<Weapon>();

    const { data: weapons, isLoading, mutate } = useSWR<Weapon[]>(
        `/characterWeapons/${characterId}`,
        () => RequestManager.getGateway<Weapon[]>(`/characterWeapons/${characterId}`),
    );

    const onClose = () => {
        setIsOpen(false);
        setSelectedWeapon(undefined);
    }

    const onEditWeapon = (weapon: Weapon) => {
        setSelectedWeapon(weapon);
        setIsOpen(true);
    }

    return (
        <Box>
            <LoadingWrapper isLoading={isLoading}>
                <Grid container spacing={2}>
                    {canEdit && (
                        <Grid size={{ sm: 4, xs: 12 }}>
                            <AddModelCard onClick={() => setIsOpen(true)} title="Add Weapon" />
                        </Grid>
                    )}
                    {weapons?.map((weapon) => (
                        <Grid key={weapon.weaponId} size={{ sm: 4, xs: 12 }}>
                            <WeaponCard weapon={weapon} onClick={canEdit ? onEditWeapon : undefined} />
                        </Grid>
                    ))}
                    {(!weapons || weapons.length === 0) && !isLoading && (
                        <Grid size={12}>
                            <Typography>No weapons found for this character.</Typography>
                        </Grid>
                    )}
                </Grid>
            </LoadingWrapper>
            <WeaponForm
                isOpen={isOpen}
                onClose={onClose}
                characterId={characterId}
                weapon={selectedWeapon}
                updateWeapons={mutate}
            />
        </Box>
    );
};