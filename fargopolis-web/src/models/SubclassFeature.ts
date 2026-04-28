export default class SubclassFeature {
    subclassFeatureId: string;
    name: string;
    level: number;
    description: string;
    subclassId: string;

    constructor(subclassFeatureId: string, name: string, level: number, description: string, subclassId: string) {
        this.subclassFeatureId = subclassFeatureId;
        this.name = name;
        this.level = level;
        this.description = description;
        this.subclassId = subclassId;
    }
}