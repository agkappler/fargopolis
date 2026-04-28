export default class Subclass {
    subclassId: string;
    name: string;
    index: string;
    classIndex: string;
    isCustomClass: boolean;
    isCustom: boolean;

    constructor(subclassId: string, name: string, index: string, classIndex: string, isCustomClass: boolean, isCustom: boolean) {
        this.subclassId = String(subclassId ?? "");
        this.name = name;
        this.index = index;
        this.classIndex = classIndex;
        this.isCustomClass = isCustomClass;
        this.isCustom = isCustom;
    }
}