import Weapon from "@/models/Weapon";
import { Badge, Box, Text } from "@chakra-ui/react";
import { ModelCard } from "../../ui/ModelCard";

interface WeaponCardProps {
    weapon: Weapon;
    onClick?: (weapon: Weapon) => void;
}

export const WeaponCard: React.FC<WeaponCardProps> = ({ weapon, onClick }) => {
    return (
        <ModelCard title={weapon.name} onClick={onClick ? () => onClick(weapon) : undefined}>
            <Box display="flex" flexWrap="wrap" gap={1} mb={1} justifyContent="center">
                <Badge>{`Damage: ${weapon.damage}`}</Badge>
                <Badge>{`Type: ${weapon.damageType}`}</Badge>
                <Badge>{`Range: ${weapon.range}`}</Badge>
            </Box>
            {weapon.description && (
                <Text fontSize="sm" lineClamp={2}>
                    {weapon.description}
                </Text>
            )}
        </ModelCard>
    );
};
