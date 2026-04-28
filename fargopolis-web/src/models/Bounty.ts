import { BountyStatus } from "@/constants/Status";

export default class Bounty {
    bountyId!: string;
    title: string;
    description: string;
    status: BountyStatus;
    categoryId: string;
    expirationDate: string;

    constructor(
        bountyId: string,
        title: string,
        description: string,
        status: BountyStatus,
        categoryId: string,
        expirationDate: string,
    ) {
        this.bountyId = bountyId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.categoryId = categoryId;
        this.expirationDate = expirationDate;
    }
}