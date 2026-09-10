import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

type DialogSize = "xs" | "sm" | "md" | "lg" | "xl" | "cover" | "full";

interface SimpleDialogProps extends PropsWithChildren {
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    maxWidth?: DialogSize;
}

export const SimpleDialog: React.FC<SimpleDialogProps> = ({ title, isOpen, onClose, children, maxWidth = "md" }) => {
    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(e) => { if (!e.open) onClose(); }}
            size={maxWidth}
            placement="center"
            lazyMount
            unmountOnExit
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        {title && (
                            <Dialog.Header justifyContent="center">
                                <Dialog.Title fontFamily="display" fontSize="xl">{title}</Dialog.Title>
                            </Dialog.Header>
                        )}
                        <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
                            <CloseButton size="sm" aria-label="close" />
                        </Dialog.CloseTrigger>
                        <Dialog.Body>
                            {children}
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};
