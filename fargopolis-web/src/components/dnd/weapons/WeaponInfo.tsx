import useSWR from "swr";
import { Box, Text, Grid, GridItem } from "@chakra-ui/react";
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
        () => RequestManager.get<Weapon[]>(`/characterWeapons/${characterId}`),
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
                <Grid templateColumns="repeat(12, 1fr)" gap={4}>
                    {canEdit && (
                        <GridItem colSpan={{ base: 12, sm: 4 }}>
                            <AddModelCard onClick={() => setIsOpen(true)} title="Add Weapon" />
                        </GridItem>
                    )}
                    {weapons?.map((weapon) => (
                        <GridItem key={weapon.weaponId} colSpan={{ base: 12, sm: 4 }}>
                            <WeaponCard weapon={weapon} onClick={canEdit ? onEditWeapon : undefined} />
                        </GridItem>
                    ))}
                    {(!weapons || weapons.length === 0) && !isLoading && (
                        <GridItem colSpan={12}>
                            <Text>No weapons found for this character.</Text>
                        </GridItem>
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