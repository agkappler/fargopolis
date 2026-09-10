import { Button } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

interface LinkButtonProps {
    url: string;
    label: string;
    isForward?: boolean;
}

const isInternalPath = (url: string) => url.startsWith("/") && !url.startsWith("//");

export const LinkButton: React.FC<LinkButtonProps> = ({ url, label, isForward = true }) => {
    const content = (
        <>
            {!isForward && <ChevronLeft size={18} />}
            {label}
            {isForward && <ChevronRight size={18} />}
        </>
    );

    if (isInternalPath(url)) {
        return (
            <Button asChild variant="ghost">
                <RouterLink to={url}>{content}</RouterLink>
            </Button>
        );
    }
    return (
        <Button asChild variant="ghost">
            <a href={url}>{content}</a>
        </Button>
    );
};
