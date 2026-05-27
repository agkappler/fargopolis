import { Button } from "@chakra-ui/react";

interface AddModelCardProps {
    onClick: () => void;
    title: string;
}

export const AddModelCard: React.FC<AddModelCardProps> = ({ onClick, title }) => {
    return (
        <Button variant={"addCard" as never} onClick={onClick} type="button">
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            {title}
        </Button>
    );
};
