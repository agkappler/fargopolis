import { getRelativeUrlInfo, Spell } from "@/api/dnd5eapi";
import RequestManager from "@/helpers/RequestManager";
import { useAuth } from "@clerk/react";
import { Add, Remove } from "@mui/icons-material";
import { Box, Button, Chip } from "@mui/material";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { SimpleDialog } from "../../ui/SimpleDialog";
import { DescriptionList } from "../DescriptionList";

interface SpllDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    spell: Spell;
    canEdit: boolean;
    characterId?: string;
    isKnown?: boolean;
    onSpellUpdate?: () => void;
}

export const SpellDetailsModal: React.FC<SpllDetailsModalProps> = ({
    isOpen,
    onClose,
    spell,
    canEdit,
    characterId,
    isKnown = false,
    onSpellUpdate
}) => {
    const { getToken } = useAuth();
    const { data: spellDetails, isLoading } = useSWR(spell.index, () => getRelativeUrlInfo(spell.url));

    const handleAddSpell = async () => {
        if (characterId && spellDetails) {
            await RequestManager.postGatewayWithAuth(
                `/character/${characterId}/addKnownSpell`,
                {
                    characterId,
                    spellKey: spellDetails.index,
                    spellName: spellDetails.name,
                    spellLevel: spellDetails.level,
                },
                getToken,
            );
            onSpellUpdate?.();
            onClose();
        }
    };

    const handleRemoveSpell = async () => {
        if (characterId && spellDetails) {
            await RequestManager.deleteGatewayWithAuth(
                `/character/${characterId}/deleteKnownSpell?spellKey=${spellDetails.index}`,
                getToken,
            );
            onSpellUpdate?.();
            onClose();
        }
    };

    return <SimpleDialog title={spell.name} isOpen={isOpen} onClose={onClose}>
        <LoadingWrapper isLoading={isLoading} size={10}>
            <Box display="flex" flexWrap="wrap" gap={1} mb={2} justifyContent="center">
                {spellDetails?.concentration && <Chip label="Concentration" />}
                {spellDetails?.casting_time && <Chip label={`Casting: ${spellDetails.casting_time}`} />}
                {spellDetails?.range && <Chip label={`Range: ${spellDetails.range}`} />}
                {spellDetails?.duration && <Chip label={`Duration: ${spellDetails.duration}`} />}
                {spellDetails?.ritual && <Chip label="Ritual" />}
                {spellDetails?.material && <Chip label={`Material: ${spellDetails.material}`} />}
            </Box>
            <DescriptionList descriptions={spellDetails?.desc} />
        </LoadingWrapper>
        {canEdit && characterId && (
            <Box display="flex" gap={2} marginTop={2}>
                {isKnown
                    ? (
                        <Button
                            color="error"
                            startIcon={<Remove />}
                            onClick={handleRemoveSpell}
                        >
                            Remove from known spells
                        </Button>
                    ) : (
                        <Button
                            color="primary"
                            startIcon={<Add />}
                            onClick={handleAddSpell}
                        >
                            Add to known spells
                        </Button>
                    )}
            </Box>
        )}
    </SimpleDialog>
}