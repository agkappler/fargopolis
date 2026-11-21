export type QuestLedgerEntryType = "COMPLETION" | "REDEMPTION";

export default class QuestLedgerEntry {
    ledgerId!: string;
    type: QuestLedgerEntryType;
    pointsDelta: number;
    occurredAt: string;
    questId?: string;
    rewardId?: string;
    questName?: string;
    rewardName?: string;

    constructor(
        ledgerId: string,
        type: QuestLedgerEntryType,
        pointsDelta: number,
        occurredAt: string,
        questId?: string,
        rewardId?: string,
        questName?: string,
        rewardName?: string,
    ) {
        this.ledgerId = ledgerId;
        this.type = type;
        this.pointsDelta = pointsDelta;
        this.occurredAt = occurredAt;
        this.questId = questId;
        this.rewardId = rewardId;
        this.questName = questName;
        this.rewardName = rewardName;
    }
}
