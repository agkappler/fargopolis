import { Text } from "@chakra-ui/react"

export const DescriptionList: React.FC<{ descriptions: string[] }> = ({ descriptions }) => {
    return descriptions.map((description, index) => (
        <Text key={index} textAlign="center">{description}</Text>
    ));
}
