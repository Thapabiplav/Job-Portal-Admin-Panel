import QuotaRequestsPageLayout from "./QuotaRequestsPageLayout";
import { Package } from "lucide-react";

export default function ProductQuotaRequestsPage() {
  return (
    <QuotaRequestsPageLayout
      listingType="product"
      pageTitle="Product quota requests"
      pageSubtitle="Review and approve +20 product slots per request"
      emptyIcon={Package}
    />
  );
}
