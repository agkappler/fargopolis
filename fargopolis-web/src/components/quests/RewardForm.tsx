import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import QuestReward from "@/models/QuestReward";
import { useAuth } from "@clerk/react";
import { Grid, GridItem } from "@chakra-ui/react";
import { type FC, useState } from "react";
import { BasicForm } from "../inputs/BasicForm";
import { NumberInput } from "../inputs/NumberInput";
import { SwitchInput } from "../inputs/SwitchInput";
import { TextInput } from "../inputs/TextInput";
import { SimpleDialog } from "../ui/SimpleDialog";

interface RewardFormProps {
    isOpen: boolean;
    onClose: () => void;
    reward?: QuestReward;
    updateRewards: () => void;
}

export const RewardForm: FC<RewardFormProps> = ({ isOpen, onClose, reward, updateRewards }) => {
    const { getToken } = useAuth();
    const isEdit = reward !== undefined;
    const [errorMessage, setErrorMessage] = useState<string>();

    const closeForm = () => {
        setErrorMessage(undefined);
        onClose();
    };

    const onSubmit = async (data: QuestReward) => {
        const payload = { ...data, pointCost: Number(data.pointCost) };
        try {
            if (reward) {
                await RequestManager.post("/updateQuestReward", { ...payload, rewardId: reward.rewardId }, getToken);
            } else {
                await RequestManager.post("/createQuestReward", payload, getToken);
            }
        } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        updateRewards();
        closeForm();
    };

    return (
        <SimpleDialog title={isEdit ? "Update Reward" : "Add Reward"} isOpen={isOpen} onClose={closeForm}>
            <BasicForm onSubmit={onSubmit} errorMessage={errorMessage} defaultValues={reward} isClerkForm>
                <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={2}>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <TextInput label="Name" fieldName="name" requiredMessage="Name is required" />
                    </GridItem>
                    <GridItem colSpan={{ base: 12, sm: 6 }}>
                        <NumberInput
                            label="Point Cost"
                            fieldName="pointCost"
                            requiredMessage="Point cost is required"
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
