import { Close } from "@mui/icons-material";
import { Breakpoint, Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { PropsWithChildren } from "react";


interface SimpleDialogProps extends PropsWithChildren {
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    maxWidth?: Breakpoint;
}

export const SimpleDialog: React.FC<SimpleDialogProps> = ({ title, isOpen, onClose, children, maxWidth = "md" }) => {
    return <Dialog open={isOpen} onClose={onClose} maxWidth={maxWidth} fullWidth>
        {title && <DialogTitle textAlign="center" variant="h4">{title}</DialogTitle>}
        <IconButton
            aria-label="close"
            onClick={onClose}
            sx={(theme) => ({
                position: 'absolute',
                right: 8,
                top: 8,
                color: theme.palette.grey[500],
            })}
        >
            <Close />
        </IconButton>
        <DialogContent>
            {children}
        </DialogContent>
    </Dialog>
}