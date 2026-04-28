import { Menu, MenuItem, IconButton } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { ReactNode, useState } from "react";

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

export const ActionMenu: React.FC<ActionMenuProps> = ({
    options,
    size = "small",
    ariaLabel = "More options"
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (onClick: () => void) => {
        onClick();
        handleMenuClose();
    };

    return (
        <>
            <IconButton
                onClick={handleMenuClick}
                size={size}
                aria-label={ariaLabel}
                aria-controls={isMenuOpen ? 'three-dot-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isMenuOpen ? 'true' : undefined}
            >
                <MoreVert />
            </IconButton>
            <Menu
                id="three-dot-menu"
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={handleMenuClose}
                MenuListProps={{
                    'aria-labelledby': 'three-dot-menu-button',
                }}
            >
                {options.map((option, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => handleMenuItemClick(option.onClick)}
                    >
                        {option.icon && <span style={{ marginRight: 8 }}>{option.icon}</span>}
                        {option.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};
