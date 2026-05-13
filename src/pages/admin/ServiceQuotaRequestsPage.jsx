import QuotaRequestsPageLayout from "./QuotaRequestsPageLayout";
import { Briefcase } from "lucide-react";

export default function ServiceQuotaRequestsPage() {
  return (
    <QuotaRequestsPageLayout
      listingType="service"
      pageTitle="Service quota requests"
      pageSubtitle="Review and approve +20 service slots per request"
      emptyIcon={Briefcase}
    />
  );
}
