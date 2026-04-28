export default class RacialTrait {
    raceTraitId?: string;
    name: string;
    description: string;

    constructor(name: string, description: string, raceTraitId?: string) {
        this.name = name;
        this.description = description;
        this.raceTraitId = raceTraitId;
    }
}