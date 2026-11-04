export interface BaseInputProps {
    label: string;
    fieldName: string;
    requiredMessage?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Short guidance shown in an info tooltip next to the label, e.g. how to derive the value. */
    info?: string;
}