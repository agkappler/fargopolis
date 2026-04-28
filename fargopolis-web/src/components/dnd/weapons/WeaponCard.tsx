import Weapon from "@/models/Weapon";
import { Typography, Box, Chip } from "@mui/material";
import { ModelCard } from "../../ui/ModelCard";

interface WeaponCardProps {
    weapon: Weapon;
    onClick?: (weapon: Weapon) => void;
}

export const WeaponCard: React.FC<WeaponCardProps> = ({ weapon, onClick }) => {
    return (
        <ModelCard title={weapon.name} onClick={onClick ? () => onClick(weapon) : undefined}>
            <Box display="flex" flexWrap="wrap" gap={1} mb={1} justifyContent="center">
                <Chip label={`Damage: ${weapon.damage}`} size="small" />
                <Chip label={`Type: ${weapon.damageType}`} size="small" />
                <Chip label={`Range: ${weapon.range}`} size="small" />
            </Box>
            {weapon.description && (
                <Typography
                    variant="body2"
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {weapon.description}
                </Typography>
            )}
        </ModelCard>
    );
};
