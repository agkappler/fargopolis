import { Chip } from "@mui/material";

export type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

interface StatusChipProps {
    label: string;
    color: ChipColor;
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, color }) => {
    return <Chip label={label} color={color} variant="outlined" className="w-fit" />
}