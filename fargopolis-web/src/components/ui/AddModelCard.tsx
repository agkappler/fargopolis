import { Add } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

interface AddModelCardProps {
    onClick: () => void;
    title: string;
}

export const AddModelCard: React.FC<AddModelCardProps> = ({ onClick, title }) => {
    return <Box
        border="dashed"
        borderColor="primary.main"
        borderRadius="4px"
        className="p-2 flex h-full shadow-md hover:shadow-lg"
        justifyContent="center"
        alignItems="center"
        role="button"
        onClick={onClick}
    >
        <Add color="primary" />
        <Typography variant="subtitle1" color="primary">{title}</Typography>
    </Box>
}