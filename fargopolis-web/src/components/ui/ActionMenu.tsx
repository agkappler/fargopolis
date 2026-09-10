import { IconButton, Menu, Portal } from "@chakra-ui/react";
import { EllipsisVertical } from "lucide-react";
import { ReactNode } from "react";

export interface MenuOption {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
}

interface ActionMenuProps {
    options: MenuOption[];
    size?: "small" | "medium" | "large";
    ariaLabel?: string;
}

const SIZE_MAP = { small: "sm", medium: "md", large: "lg" } as const;

export const ActionMenu: React.FC<ActionMenuProps> = ({
    options,
    size = "small",
    ariaLabel = "More options"
}) => {
    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                <IconButton variant="ghost" size={SIZE_MAP[size]} aria-label={ariaLabel}>
                    <EllipsisVertical />
                </IconButton>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content>
                        {options.map((option, index) => (
                            <Menu.Item
                                key={index}
                                value={option.label}
                                onSelect={option.onClick}
                            >
                                {option.icon && <span style={{ marginRight: 8, display: "inline-flex" }}>{option.icon}</span>}
                                {option.label}
                            </Menu.Item>
                        ))}
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    );
};
