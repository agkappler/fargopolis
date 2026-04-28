import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Subclass from "@/models/Subclass";
import { useAuth } from "@clerk/react";
import { Grid } from "@mui/material";
import { useState } from "react";
import { BasicForm } from "../../inputs/BasicForm";
import { TextInput } from "../../inputs/TextInput";
import { SimpleDialog } from "../../ui/SimpleDialog";

interface SubclassFormProps {
    isOpen: boolean;
    onClose: () => void;
    subclass?: Subclass;
    updateSubclasses: () => void;
}

export const SubclassForm: React.FC<SubclassFormProps> = ({ isOpen, onClose, subclass, updateSubclasses }) => {
    const { getToken } = useAuth();
    const isEdit = subclass !== undefined;
    const defaultSubclass = new Subclass("", "", "", "", true, true);
    const [errorMessage, setErrorMessage] = useState<string>();
    const closeForm = () => {
        setErrorMessage(undefined);
        onClose();
    }

    const onSubmit = async (data: Subclass) => {
        try {
            if (isEdit) {
                await RequestManager.putGatewayWithAuth(`/subclasses/updateSubclass/${data.subclassId}`, data, getToken);
            } else {
                await RequestManager.postGatewayWithAuth("/subclasses/createSubclass", data, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateSubclasses();
        closeForm();
    }

    return <SimpleDialog title={isEdit ? "Update Subclass" : "Add Subclass"} isOpen={isOpen} onClose={closeForm}>
        <BasicForm
            onSubmit={onSubmit}
            errorMessage={errorMessage}
            defaultValues={subclass ?? defaultSubclass}
            isClerkForm
        >
            <Grid container spacing={2} className="mb-2">
                <Grid size={12}>
                    <TextInput
                        label="Name"
                        fieldName="name"
                        requiredMessage="Name is required"
                    />
                </Grid>
                <Grid size={12}>
                    <TextInput
                        label="Description"
                        fieldName="description"
                        requiredMessage="Description is required"
                        multilineRows={4}
                    />
                </Grid>
                <Grid size={6}>
                    <TextInput
                        label="Index"
                        fieldName="index"
                        requiredMessage="Index is required"
                    />
                </Grid>
                <Grid size={6}>
                    <TextInput
                        label="Class Index"
                        fieldName="classIndex"
                        requiredMessage="Class index is required"
                    />
                </Grid>
            </Grid>
        </BasicForm>
    </SimpleDialog>
}
