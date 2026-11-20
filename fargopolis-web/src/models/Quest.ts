export default class Quest {
    questId!: string;
    name: string;
    description: string;
    pointValue: number;
    active: boolean;

    constructor(
        questId: string,
        name: string,
        description: string,
        pointValue: number,
        active: boolean,
    ) {
        this.questId = questId;
        this.name = name;
        this.description = description;
        this.pointValue = pointValue;
        this.active = active;
    }
}
