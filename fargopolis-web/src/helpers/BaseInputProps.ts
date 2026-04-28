export interface BaseInputProps {
    label: string;
    fieldName: string;
    requiredMessage?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}