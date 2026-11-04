import { SimpleDialog } from "../ui/SimpleDialog";
import { WizardContent } from "./wizard/WizardContent";

interface CharacterCreateWizardProps {
    isOpen: boolean;
    onClose: () => void;
    updateCharacters: () => void;
}

/**
 * Multi-step (4–5 steps depending on class) character creation flow. All form state lives in WizardContent,
 * which unmounts when the dialog closes, so each opening starts fresh.
 */
export const CharacterCreateWizard: React.FC<CharacterCreateWizardProps> = ({ isOpen, onClose, updateCharacters }) => {
    // Always refresh on close: step 1 already created the character, even if the user bails early.
    const handleClose = () => {
        updateCharacters();
        onClose();
    };

    return (
        <SimpleDialog isOpen={isOpen} onClose={handleClose} maxWidth="lg">
            <WizardContent onDone={handleClose} />
        </SimpleDialog>
    );
};
