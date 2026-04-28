import { Paper, Typography } from "@mui/material";
import { PropsWithChildren } from "react";

interface ModelCardProps extends PropsWithChildren {
    title: string;
    onClick?: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ title, onClick, children }) => {
    return <Paper
        elevation={3}
        className="p-2 h-full flex flex-col text-center items-center"
        role={onClick ? "button" : undefined}
        onClick={onClick}
    >
        <Typography variant="h6">{title}</Typography>
        {children}
    </Paper>
}