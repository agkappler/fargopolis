import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Quest from "@/models/Quest";
import { useAuth } from "@clerk/react";
import { Grid, GridItem } from "@chakra-ui/react";
import { type FC, useState } from "react";
import { BasicForm } from "../inputs/BasicForm";
import { NumberInput } from "../inputs/NumberInput";
import { SwitchInput } from "../inputs/SwitchInput";
import { TextInput } from "../inputs/TextInput";
import { SimpleDialog } from "../ui/SimpleDialog";

interface QuestFormProps {
    isOpen: boolean;
    onClose: () => void;
    quest?: Quest;
    updateQuests: () => void;
}

export const QuestForm: FC<QuestFormProps> = ({ isOpen, onClose, quest, updateQuests }) => {
    const { getToken } = useAuth();
    const isEdit = quest !== undefined;
    const [errorMessage, setErrorMessage] = useState<string>();

    const closeForm = () => {
        setErrorMessage(undefined);
        onClose();
    };

    const onSubmit = async (data: Quest) => {
        // NumberInput's underlying <Input> yields a string; coerce before sending so the API's
        // `isinstance(value, int)` validation (shared/lambda_utils-adjacent quests handler) sees a number.
        const payload = { ...data, pointValue: Number(data.pointValue) };
        try {
            if (quest) {
                await RequestManager.post("/updateQuest", { ...payload, questId: quest.questId }, getToken);
            } else {
                await RequestManager.post("/createQuest", payload, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateQuests();
        closeForm();
    };

    return (
        <SimpleDialog title={isEdit ? "Update Quest" : "Add Quest"} isOpen={isOpen} onClose={closeForm}>
            <BasicForm onSubmit={onSubmit} errorMessage={errorMessage} defaultValues={quest} isClerkForm>
                <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={2}>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <TextInput label="Name" fieldName="name" requiredMessage="Name is required" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <NumberInput
                            label="Point Value"
                            fieldName="pointValue"
                            requiredMessage="Point value is required"
                            min={1}
                        />
                    </GridItem>
                    <GridItem colSpan={12}>
                        <TextInput label="Description" fieldName="description" multilineRows={4} />
                    </GridItem>
                    {isEdit && (
                        <GridItem colSpan={12}>
                            <SwitchInput label="Active" fieldName="active" />
                        </GridItem>
                    )}
                </Grid>
            </BasicForm>
        </SimpleDialog>
    );
};
