export default class QuestReward {
    rewardId!: string;
    name: string;
    description: string;
    pointCost: number;
    active: boolean;

    constructor(
        rewardId: string,
        name: string,
        description: string,
        pointCost: number,
        active: boolean,
    ) {
        this.rewardId = rewardId;
        this.name = name;
        this.description = description;
        this.pointCost = pointCost;
        this.active = active;
    }
}
