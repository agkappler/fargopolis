import { ABILITY_SOURCE_OPTIONS, AbilitySource, USAGE_TYPE_OPTIONS, UsageType } from "@/constants/Abilities";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Ability from "@/models/Ability";
import { useAuth } from "@clerk/react";
import { Grid } from "@mui/material";
import React, { useState } from "react";
import { BasicForm } from "../../inputs/BasicForm";
import { DropdownInput } from "../../inputs/DropdownInput";
import { TextInput } from "../../inputs/TextInput";
import { SimpleDialog } from "../../ui/SimpleDialog";

interface AbilityFormProps {
    isOpen: boolean;
    onClose: () => void;
    characterId?: string;
    ability?: Ability;
    defaultSource?: AbilitySource;
    defaultSourceDescription?: string;
    defaultName?: string;
    defaultDescription?: string;
    onAbilityUpdate?: () => void;
}

export const AbilityForm: React.FC<AbilityFormProps> = ({
    isOpen,
    onClose,
    characterId,
    ability,
    defaultSource,
    defaultSourceDescription,
    defaultName,
    defaultDescription,
    onAbilityUpdate
}) => {
    const { getToken } = useAuth();
    const isEdit = ability !== undefined;
    const [errorMessage, setErrorMessage] = useState<string>();

    const closeForm = () => {
        setErrorMessage(undefined);
        onClose();
    }

    const getDefaultValues = (): Ability => {
        if (ability) {
            return ability;
        }
        return {
            abilityId: "",
            characterId: characterId ?? "",
            name: defaultName || "",
            description: defaultDescription || "",
            source: defaultSource || AbilitySource.Other,
            sourceDescription: defaultSourceDescription || "",
            usage: UsageType.Action,
            recovery: ""
        };
    };

    const onSubmit = async (data: Ability) => {
        try {
            const abilityData = {
                ...data,
                characterId: characterId ?? "",
                abilityId: ability?.abilityId ?? "",
            };

            if (isEdit) {
                await RequestManager.putGatewayWithAuth(`/updateAbility/${ability.abilityId}`, abilityData, getToken);
            } else {
                await RequestManager.postGatewayWithAuth(`/addAbility/${characterId}`, abilityData, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        onAbilityUpdate?.();
        closeForm();
    }

    const handleDelete = async () => {
        if (!ability || !characterId) return;

        try {
            await RequestManager.deleteGatewayWithAuth(`/deleteAbility/${ability.abilityId}`, getToken);
            onAbilityUpdate?.();
            closeForm();
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
        }
    }

    return (
        <SimpleDialog title={isEdit ? "Update Ability" : "Create Ability"} isOpen={isOpen} onClose={closeForm}>
            <BasicForm
                onSubmit={onSubmit}
                defaultValues={getDefaultValues()}
                onDelete={isEdit ? handleDelete : undefined}
                errorMessage={errorMessage}
                isClerkForm
            >
                <Grid container spacing={2} className="mb-2">
                    <Grid size={12}>
                        <TextInput
                            label="Ability Name"
                            fieldName="name"
                            requiredMessage="Ability name is required"
                        />
                    </Grid>
                    <Grid size={6}>
                        <DropdownInput
                            label="Source"
                            fieldName="source"
                            options={ABILITY_SOURCE_OPTIONS}
                            requiredMessage="Source is required"
                        />
                    </Grid>
                    <Grid size={6}>
                        <TextInput
                            label="Source Description"
                            fieldName="sourceDescription"
                            requiredMessage="Source description is required"
                        />
                    </Grid>
                    <Grid size={6}>
                        <DropdownInput
                            label="Usage"
                            fieldName="usage"
                            options={USAGE_TYPE_OPTIONS}
                            requiredMessage="Usage is required"
                        />
                    </Grid>
                    <Grid size={6}>
                        <TextInput
                            label="Recovery"
                            fieldName="recovery"
                            requiredMessage="Recovery is required"
                        />
                    </Grid>
                    <Grid size={12}>
                        <TextInput
                            label="Description"
                            fieldName="description"
                            multilineRows={4}
                            requiredMessage="Description is required"
                        />
                    </Grid>
                </Grid>
            </BasicForm>
        </SimpleDialog>
    );
};
