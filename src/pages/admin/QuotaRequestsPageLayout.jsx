import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { StatCard } from "../../components/cards/StatCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { MobileDetailEyeButton } from "../../components/mobile/MobileDetailEyeButton";
import { Modal } from "../../components/modals/Modal";
import { adminAPI } from "../../api/axios";
import {
  ClipboardList,
  Clock,
  Package,
  Briefcase,
  ShieldCheck,
  XCircle,
  FileText,
} from "lucide-react";
import { storefrontPublicUrl } from "../../utils/storefrontUrl";

const statIconSize = "w-5 h-5";

const actionButtonClassName =
  "gap-2 px-4 sm:px-5 font-semibold tracking-wide shadow-[0_4px_24px_rgba(167,139,250,0.35)] ring-2 ring-white/20 hover:ring-accent/50 hover:shadow-[0_6px_28px_rgba(167,139,250,0.45)] active:scale-[0.98] transition-transform";

const rejectButtonClassName =
  "gap-2 px-4 sm:px-5 font-semibold tracking-wide shadow-[0_4px_24px_rgba(248,113,113,0.22)] ring-2 ring-red-500/30 hover:ring-red-400/50 hover:shadow-[0_6px_28px_rgba(248,113,113,0.3)] active:scale-[0.98] transition-transform";

const quotaCvLinkDesktop =
  "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-hover px-3 py-2 text-sm font-medium text-text-primary transition-ui hover:bg-white/10";

const quotaCvLinkMobile =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 text-sm font-semibold text-accent transition-ui hover:bg-accent/15";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusBadgeVariant = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return "success";
  if (s === "rejected") return "danger";
  return "warning";
};

const statusLabel = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  return s || "—";
};

/**
 * Shared admin UI for product/service listing quota requests — matches Approve Companies layout.
 * @param {"product" | "service"} props.listingType
 */
export default function QuotaRequestsPageLayout({
  listingType,
  pageTitle,
  pageSubtitle,
  emptyIcon: EmptyIcon = ClipboardList,
}) {
  const [filter, setFilter] = useState(""); // '' | pending | approved | rejected
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [confirmModal, setConfirmModal] = useState(null);

  const apiStatus = filter === "" ? undefined : filter;

  const loadStats = useCallback(async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        adminAPI.getListingQuotaRequests({
          listingType,
          status: "pending",
          page: 1,
          limit: 1,
        }),
        adminAPI.getListingQuotaRequests({
          listingType,
          status: "approved",
          page: 1,
          limit: 1,
        }),
      ]);
      setPendingTotal(Number(pRes?.data?.pagination?.totalItems ?? 0));
      setApprovedTotal(Number(aRes?.data?.pagination?.totalItems ?? 0));
    } catch {
      setPendingTotal(0);
      setApprovedTotal(0);
    }
  }, [listingType]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { listingType, page, limit: perPage };
      if (apiStatus) params.status = apiStatus;
      const res = await adminAPI.getListingQuotaRequests(params);
      setList(res?.data?.data || []);
      setPagination(res?.data?.pagination || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load requests");
      setList([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [listingType, page, perPage, apiStatus]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setExpandedRowId(null);
  }, [filter, page]);

  const tabClass = (active) =>
    `min-h-[44px] px-4 py-2 rounded-xl font-medium transition-ui tap-feedback ${
      active
        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-[var(--shadow-glow)]"
        : "bg-surface-soft border border-white/10 text-text-secondary hover:bg-hover hover:text-text-primary"
    }`;

  const runApprove = async (id) => {
    setActionId(id);
    try {
      await adminAPI.approveListingQuotaRequest(id, { increment: 20 });
      toast.success(
        listingType === "product"
          ? "Approved (+20 product slots)."
          : "Approved (+20 service slots).",
      );
      await load();
      await loadStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approve failed");
    } finally {
      setActionId(null);
    }
  };

  const runReject = async (id) => {
    setActionId(id);
    try {
      await adminAPI.rejectListingQuotaRequest(id);
      toast.success("Request rejected.");
      await load();
      await loadStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reject failed");
    } finally {
      setActionId(null);
    }
  };

  const openApproveConfirm = (r) => {
    const requester = r?.requester || {};
    setConfirmModal({
      type: "approve",
      id: r.id,
      requesterLabel: requester.name || requester.email || "this user",
    });
  };

  const openRejectConfirm = (r) => {
    const requester = r?.requester || {};
    setConfirmModal({
      type: "reject",
      id: r.id,
      requesterLabel: requester.name || requester.email || "this user",
    });
  };

  const handleConfirmYes = async () => {
    if (!confirmModal) return;
    const { type, id } = confirmModal;
    setConfirmModal(null);
    if (type === "approve") await runApprove(id);
    else await runReject(id);
  };

  const totalPages = pagination?.totalPages || 1;
  const isProduct = listingType === "product";
  const TypeIcon = isProduct ? Package : Briefcase;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">
          {pageTitle}
        </h1>
        <p className="text-text-primary text-sm mt-1">{pageSubtitle}</p>
      </div>

      <section className="grid grid-cols-2 gap-2 md:gap-4">
        <StatCard
          compact
          title={
            <>
              <span className="md:hidden">Pending</span>
              <span className="hidden md:inline">
                Pending {isProduct ? "product" : "service"} requests
              </span>
            </>
          }
          value={pendingTotal}
          icon={<Clock className={statIconSize} />}
        />
        <StatCard
          compact
          title={
            <>
              <span className="md:hidden">Approved</span>
              <span className="hidden md:inline">
                Approved {isProduct ? "product" : "service"} requests
              </span>
            </>
          }
          value={approvedTotal}
          icon={<ShieldCheck className={statIconSize} />}
        />
      </section>

      <div className="flex flex-wrap gap-2" role="tablist">
        <button
          type="button"
          onClick={() => {
            setFilter("");
            setPage(1);
          }}
          className={tabClass(filter === "")}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("pending");
            setPage(1);
          }}
          className={tabClass(filter === "pending")}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("approved");
            setPage(1);
          }}
          className={tabClass(filter === "approved")}
        >
          Approved
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter("rejected");
            setPage(1);
          }}
          className={tabClass(filter === "rejected")}
        >
          Rejected
        </button>
      </div>

      <Card padding={false}>
        {loading && !list.length ? (
          <div className="p-4 sm:p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl overflow-hidden">
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="bg-input border-b border-accent">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent rounded-tl-xl border-r border-accent/40">
                      Request
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent border-r border-accent/40">
                      Contact
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent border-r border-accent/40">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent rounded-tr-xl border-r-0">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => {
                    const requester = r?.requester || {};
                    const pending = String(r.status || "").toLowerCase() === "pending";
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-accent/40 text-[#FFFFFF] transition-shadow admin-table-row-hover hover:bg-hover/30"
                      >
                        <td className="py-3 px-4 border-r border-accent/40">
                          <div className="flex items-start gap-2">
                            <TypeIcon className="h-4 w-4 shrink-0 text-accent mt-0.5" aria-hidden />
                            <div className="min-w-0">
                              <span className="font-medium text-[#FFFFFF] block">
                                {requester.name || "—"}
                              </span>
                              <span className="block text-xs text-text-secondary mt-0.5">
                                {formatDate(r.createdAt)}
                              </span>
                              {r.message ? (
                                <span className="block text-xs text-text-muted mt-1 line-clamp-2">
                                  {r.message}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#FFFFFF] border-r border-accent/40">
                          <div className="space-y-1">
                            <span className="block font-medium text-[#FFFFFF]">
                              {requester.name || "—"}
                            </span>
                            <span className="block break-all text-sm text-text-secondary">
                              {requester.email || "—"}
                            </span>
                            <span className="block text-xs text-text-muted capitalize">
                              {requester.role || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-accent/40">
                          <Badge variant={statusBadgeVariant(r.status)}>
                            {statusLabel(r.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 border-r-0">
                          <div className="flex flex-wrap items-center gap-3">
                            {requester.cvSlug && storefrontPublicUrl(requester.cvSlug) ? (
                              <a
                                href={storefrontPublicUrl(requester.cvSlug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={quotaCvLinkDesktop}
                              >
                                <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                                View CV
                              </a>
                            ) : null}
                            {pending ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => openApproveConfirm(r)}
                                  disabled={actionId === r.id}
                                  className={actionButtonClassName}
                                >
                                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                                  Approve +20
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => openRejectConfirm(r)}
                                  disabled={actionId === r.id}
                                  className={rejectButtonClassName}
                                >
                                  <XCircle className="h-4 w-4 shrink-0" aria-hidden />
                                  Reject
                                </Button>
                              </>
                            ) : !requester.cvSlug ? (
                              <span className="text-xs text-text-muted">—</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-white/10">
              {list.map((r) => {
                const requester = r?.requester || {};
                const expanded = expandedRowId === r.id;
                const pending = String(r.status || "").toLowerCase() === "pending";
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-primary line-clamp-2 pr-1 flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                          {requester.name || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={statusBadgeVariant(r.status)}>
                            {statusLabel(r.status)}
                          </Badge>
                        </div>
                      </div>
                      <MobileDetailEyeButton
                        expanded={expanded}
                        onClick={() =>
                          setExpandedRowId((id) => (id === r.id ? null : r.id))
                        }
                        aria-label={
                          expanded ? "Hide request details" : "Show request details"
                        }
                      />
                    </div>
                    <div className="mt-3 flex min-h-[44px] flex-wrap items-center gap-3">
                      {requester.cvSlug && storefrontPublicUrl(requester.cvSlug) ? (
                        <a
                          href={storefrontPublicUrl(requester.cvSlug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={quotaCvLinkMobile}
                        >
                          <FileText className="h-4 w-4 shrink-0" aria-hidden />
                          View CV
                        </a>
                      ) : null}
                      {pending ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openApproveConfirm(r)}
                            disabled={actionId === r.id}
                            className={`min-h-[44px] shrink-0 ${actionButtonClassName}`}
                          >
                            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                            Approve +20
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => openRejectConfirm(r)}
                            disabled={actionId === r.id}
                            className={`min-h-[44px] shrink-0 ${rejectButtonClassName}`}
                          >
                            <XCircle className="h-4 w-4 shrink-0" aria-hidden />
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                    {expanded && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/3 px-3 py-3 space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            Request ID
                          </p>
                          <p className="mt-1 break-all font-mono text-xs text-text-primary">
                            {r.id}
                          </p>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            Submitted
                          </p>
                          <p className="mt-1 text-sm text-text-primary">{formatDate(r.createdAt)}</p>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            Contact
                          </p>
                          <p className="mt-1 text-sm text-text-primary">{requester.name || "—"}</p>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            Email
                          </p>
                          <p className="mt-1 break-all text-sm text-text-primary">
                            {requester.email || "—"}
                          </p>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            Role
                          </p>
                          <p className="mt-1 text-sm text-text-primary capitalize">
                            {requester.role || "—"}
                          </p>
                        </div>
                        {r.message ? (
                          <div className="border-t border-white/10 pt-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                              Message
                            </p>
                            <p className="mt-1 text-sm text-text-primary whitespace-pre-wrap">
                              {r.message}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted mb-4">
                  <EmptyIcon className="w-8 h-8" />
                </div>
                <p className="text-text-primary font-medium">No requests found</p>
                <p className="text-sm text-text-secondary mt-1">Try a different filter</p>
              </div>
            )}
          </>
        )}

        {((pagination?.totalItems ?? 0) > 0 || totalPages >= 1) && (
          <Pagination
            currentPage={pagination?.currentPage || page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={perPage}
            onItemsPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
            totalItems={pagination?.totalItems}
          />
        )}
      </Card>

      <Modal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={
          confirmModal?.type === "approve"
            ? "Approve quota request?"
            : "Reject quota request?"
        }
        size="sm"
      >
        {confirmModal ? (
          <Card className="border border-white/10 bg-white/2 shadow-none hover:shadow-none">
            <p className="text-sm text-text-secondary leading-relaxed">
              {confirmModal.type === "approve" ? (
                <>
                  Grant <strong className="text-text-primary">+20</strong>{" "}
                  {isProduct ? "product" : "service"} slots to{" "}
                  <strong className="text-text-primary">
                    {confirmModal.requesterLabel}
                  </strong>
                  ?
                </>
              ) : (
                <>
                  Reject the {isProduct ? "product" : "service"} quota request
                  from{" "}
                  <strong className="text-text-primary">
                    {confirmModal.requesterLabel}
                  </strong>
                  ? This will mark the request as rejected.
                </>
              )}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px] px-5 font-semibold"
                onClick={() => setConfirmModal(null)}
              >
                No
              </Button>
              <Button
                type="button"
                variant={confirmModal.type === "approve" ? "primary" : "danger"}
                className={`min-h-[44px] px-5 font-semibold ${
                  confirmModal.type === "approve" ? actionButtonClassName : rejectButtonClassName
                }`}
                onClick={handleConfirmYes}
                disabled={actionId === confirmModal.id}
              >
                Yes
              </Button>
            </div>
          </Card>
        ) : null}
      </Modal>
    </div>
  );
}
