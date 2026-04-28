import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import BountyCategory from "@/models/BountyCategory";
import { useAuth } from "@clerk/react";
import { type FC, useState } from "react";
import { BasicForm } from "../inputs/BasicForm";
import { TextInput } from "../inputs/TextInput";
import { SimpleDialog } from "../ui/SimpleDialog";

interface BountyCategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    updateBountyCategories: () => void;
}

export const BountyCategoryForm: FC<BountyCategoryFormProps> = ({ onClose, isOpen, updateBountyCategories }) => {
    const { getToken } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string>();

    const closeForm = () => {
        setErrorMessage(undefined);
        onClose();
    };

    const onSubmit = async (data: BountyCategory) => {
        try {
            await RequestManager.postGatewayWithAuth(`/createBountyCategory`, data, getToken);
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateBountyCategories();
        closeForm();
    };

    return (
        <SimpleDialog title="Add Bounty Category" isOpen={isOpen} onClose={closeForm}>
            <BasicForm onSubmit={onSubmit} errorMessage={errorMessage} isClerkForm>
                <TextInput label="Name" fieldName="name" requiredMessage="Name is required" />
            </BasicForm>
        </SimpleDialog>
    );
};
