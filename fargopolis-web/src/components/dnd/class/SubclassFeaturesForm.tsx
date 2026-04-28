import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import SubclassFeature from "@/models/SubclassFeature";
import { useAuth } from "@clerk/react";
import { Grid } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";
import { BasicForm } from "../../inputs/BasicForm";
import { ListInput } from "../../inputs/ListInput";
import { NumberInput } from "../../inputs/NumberInput";
import { TextInput } from "../../inputs/TextInput";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { SimpleDialog } from "../../ui/SimpleDialog";

interface SubclassFeaturesFormProps {
    subclassId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface SubclassFeaturesFormData {
    features: SubclassFeature[];
}

export const SubclassFeaturesForm: React.FC<SubclassFeaturesFormProps> = ({ isOpen, onClose, subclassId }) => {
    const { getToken } = useAuth();
    const { data: subclassFeatures, isLoading, mutate: updateFeatures } = useSWR(
        isOpen && subclassId ? ([`/gateway/subclasses`, subclassId, "features"] as const) : null,
        () => RequestManager.getGateway<SubclassFeature[]>(`/subclasses/${subclassId}/features`),
    );
    const [errorMessage, setErrorMessage] = useState<string>();
    const onSubmit = async (data: SubclassFeaturesFormData) => {
        try {
            await RequestManager.postGatewayWithAuth(`/subclasses/${subclassId}/updateFeatures`, data.features, getToken);
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateFeatures();
        onClose();
    }

    return <SimpleDialog title="Subclass Features" isOpen={isOpen} onClose={onClose}>
        <BasicForm
            onSubmit={onSubmit}
            defaultValues={{ features: subclassFeatures ?? [] }}
            errorMessage={errorMessage}
            isClerkForm
        >
            <LoadingWrapper isLoading={isLoading}>
                <ListInput
                    fieldName="features"
                    addText="Add Feature"
                    defaultItem={{ subclassId: subclassId }}
                    listItemComponent={({ idx, removeButton }) => (
                        <Grid container spacing={1} key={idx} alignItems="center" marginBottom={2}>
                            <Grid size={5}>
                                <TextInput
                                    label="Feature Name"
                                    fieldName={`features.[${idx}].name`}
                                    requiredMessage="Feature name is required"
                                />
                            </Grid>
                            <Grid size={2}>
                                <NumberInput
                                    label="Level"
                                    fieldName={`features.[${idx}].level`}
                                    requiredMessage="Level is required"
                                />
                            </Grid>
                            <Grid size={4}>
                                <TextInput
                                    label="Description"
                                    fieldName={`features.[${idx}].description`}
                                    requiredMessage="Description is required"
                                />
                            </Grid>
                            <Grid size={1}>{removeButton}</Grid>
                        </Grid>
                    )}
                />
            </LoadingWrapper>
        </BasicForm>
    </SimpleDialog>
}
