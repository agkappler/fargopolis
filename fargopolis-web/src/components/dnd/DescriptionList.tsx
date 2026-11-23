import { Text } from "@chakra-ui/react"

interface DescriptionListProps {
    descriptions: string[];
    textAlign?: "left" | "center";
}

export const DescriptionList: React.FC<DescriptionListProps> = ({ descriptions, textAlign = "center" }) => {
    return descriptions?.map((description, index) => (
        <Text key={index} textAlign={textAlign}>{description}</Text>
    ));
}
