import { BOUNTY_STATUS_OPTIONS } from "@/constants/Status";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Bounty from "@/models/Bounty";
import BountyCategory from "@/models/BountyCategory";
import { useAuth } from "@clerk/react";
import { Grid, GridItem } from "@chakra-ui/react";
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
                await RequestManager.post("/updateBounty", data, getToken);
            } else {
                await RequestManager.post("/createBounty", data, getToken);
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
                <Grid templateColumns="repeat(12, 1fr)" gap={4} className="mb-2">
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <TextInput label="Title" fieldName="title" requiredMessage="Title is required" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <DropdownInput
                            label="Category"
                            fieldName="categoryId"
                            options={bountyCategories.map((category) => ({
                                value: category.categoryId,
                                label: category.name,
                            }))}
                            requiredMessage="Category is required"
                        />
                    </GridItem>
                    {isEdit && (
                        <GridItem colSpan={{ base: 12, sm: 6 }}>
                            <DropdownInput label="Status" fieldName="status" options={BOUNTY_STATUS_OPTIONS} />
                        </GridItem>
                    )}
                    <GridItem colSpan={12}>
                        <TextInput
                            label="Description"
                            fieldName="description"
                            requiredMessage="Description is required"
                            multilineRows={4}
                        />
                    </GridItem>
                </Grid>
            </BasicForm>
        </SimpleDialog>
    );
};
