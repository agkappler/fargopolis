import RequestManager from "@/helpers/RequestManager"
import { Link } from "@chakra-ui/react"
import { FileText } from "lucide-react"
import useSWR from "swr"

export const ResumeWrapper: React.FC = () => {
    const { data } = useSWR<{ url: string }>("/getLatestResumeUrl", () =>
        RequestManager.get<{ url: string }>("/getLatestResumeUrl"),
    );
    return <Link href={data?.url ?? ""} target="_blank" rel="noopener noreferrer" display="inline-flex" alignItems="center" gap="1">
        <FileText size={18} />Resume
    </Link>
}
