import { ChipColor } from "@/components/ui/StatusChip";

export enum ProjectStatus {
    InProgress = "In Progress",
    Complete = "Completed",
    Concept = "Concept",
}

export function getColorForProjectStatus(status: ProjectStatus): ChipColor {
    switch (status) {
        case ProjectStatus.Complete:
            return "success";
        case ProjectStatus.Concept:
            return "warning";
        case ProjectStatus.InProgress:
        default:
            return "info";
    }
}

/** String literals sent to / received from the Lambda API (DynamoDB stores uppercase). */
export const BountyStatus = {
    Active: "ACTIVE",
    Overdue: "OVERDUE",
    Complete: "COMPLETE",
} as const;

export type BountyStatus = (typeof BountyStatus)[keyof typeof BountyStatus];

export const BOUNTY_STATUS_OPTIONS = [
    { value: BountyStatus.Active, label: "Active" },
    { value: BountyStatus.Complete, label: "Complete" },
    { value: BountyStatus.Overdue, label: "Overdue" },
];

export function getLabelForBountyStatus(status: BountyStatus): string {
    return BOUNTY_STATUS_OPTIONS.find(o => o.value === status)?.label ?? "Unknown";
}

export function getColorForBountyStatus(status: BountyStatus): ChipColor {
    switch (status) {
        case BountyStatus.Complete:
            return "success";
        case BountyStatus.Overdue:
            return "error";
        case BountyStatus.Active:
        default:
            return "info";
    }
}
