import { BOUNTY_STATUS_OPTIONS } from "@/constants/Status";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Bounty from "@/models/Bounty";
import BountyCategory from "@/models/BountyCategory";
import { useAuth } from "@clerk/react";
import { Grid } from "@mui/material";
import { type FC, useState } from "react";
import { BasicForm } from "../inputs/BasicForm";
import { DropdownInput } from "../inputs/DropdownInput";
import { TextInput } from "../inputs/TextInput";
import { SimpleDialog } from "../ui/SimpleDialog";

interface BountyFormProps {
    isOpen: boolean;
    onClose: () => void;
    bounty?: Bounty;
    updateBounties: () => void;
    bountyCategories: BountyCategory[];
}

export const BountyForm: FC<BountyFormProps> = ({
    isOpen,
    onClose,
    bounty,
    updateBounties,
    bountyCategories,
}) => {
    const { getToken } = useAuth();
    const isEdit = bounty !== undefined;
    const [errorMessage, setErrorMessage] = useState<string>();
    const closeForm = () => {
        setErrorMessage(undefined);
        onClose();
    };

    const onSubmit = async (data: Bounty) => {
        try {
            if (isEdit) {
                await RequestManager.postGatewayWithAuth("/updateBounty", data, getToken);
            } else {
                await RequestManager.postGatewayWithAuth("/createBounty", data, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateBounties();
        closeForm();
    };

    return (
        <SimpleDialog title={isEdit ? "Update Bounty" : "Post Bounty"} isOpen={isOpen} onClose={closeForm}>
            <BasicForm
                onSubmit={onSubmit}
                errorMessage={errorMessage}
                defaultValues={bounty}
                isClerkForm
            >
                <Grid container spacing={2} className="mb-2">
                    <Grid size={6}>
                        <TextInput label="Title" fieldName="title" requiredMessage="Title is required" />
                    </Grid>
                    <Grid size={6}>
                        <DropdownInput
                            label="Category"
                            fieldName="categoryId"
                            options={bountyCategories.map((category) => ({
                                value: category.categoryId,
                                label: category.name,
                            }))}
                            requiredMessage="Category is required"
                        />
                    </Grid>
                    {isEdit && (
                        <Grid size={6}>
                            <DropdownInput label="Status" fieldName="status" options={BOUNTY_STATUS_OPTIONS} />
                        </Grid>
                    )}
                    <Grid size={12}>
                        <TextInput
                            label="Description"
                            fieldName="description"
                            requiredMessage="Description is required"
                            multilineRows={4}
                        />
                    </Grid>
                </Grid>
            </BasicForm>
        </SimpleDialog>
    );
};
