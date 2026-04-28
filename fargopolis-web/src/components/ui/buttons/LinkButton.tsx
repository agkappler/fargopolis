import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

interface LinkButtonProps {
    url: string;
    label: string;
    isForward?: boolean;
}

const isInternalPath = (url: string) => url.startsWith("/") && !url.startsWith("//");

export const LinkButton: React.FC<LinkButtonProps> = ({ url, label, isForward = true }) => {
    const icons = {
        startIcon: isForward ? undefined : <ChevronLeft />,
        endIcon: isForward ? <ChevronRight /> : undefined,
    };
    if (isInternalPath(url)) {
        return (
            <Button variant="text" component={RouterLink} to={url} {...icons}>
                {label}
            </Button>
        );
    }
    return (
        <Button variant="text" href={url} {...icons}>
            {label}
        </Button>
    );
};
