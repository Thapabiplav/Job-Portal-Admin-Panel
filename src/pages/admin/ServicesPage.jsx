import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/modals/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { MobileDetailEyeButton } from "../../components/mobile/MobileDetailEyeButton";
import { adminAPI } from "../../api/axios";
import {
  fetchServiceBookings,
  updateServiceBookingStatusThunk,
  selectServiceBookingsList,
  selectServiceBookingsPagination,
  selectServiceBookingsLoading,
  selectServiceBookingsError,
  selectServiceBookingsActionLoading,
  selectServiceBookingsActionError,
  clearServiceBookingsError,
} from "../../features/serviceBookings/serviceBookingsSlice";

const STATUS_OPTIONS = ["pending", "confirmed", "in_progress", "completed", "cancelled"];

const titleCase = (value = "") =>
  String(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const normalizeServiceStatus = (value = "") => {
  const raw = String(value || "").toLowerCase();
  if (raw === "processing" || raw === "shipping" || raw === "in progress") return "in_progress";
  if (raw === "delivered") return "completed";
  return raw;
};

const prettyServiceStatus = (value = "") => {
  const safe = normalizeServiceStatus(value);
  if (safe === "in_progress") return "In Progress";
  return titleCase(safe);
};

const getBookingActions = (statusValue = "") => {
  const status = normalizeServiceStatus(statusValue);
  if (status === "pending") return ["confirmed", "cancelled"];
  if (status === "confirmed") return ["in_progress", "completed"];
  if (status === "in_progress") return ["completed"];
  return [];
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value || "0");
  return num.toLocaleString("en-US");
};

const buildServiceWhatsAppText = (booking) => {
  const vendorName = booking?.seller?.name || booking?.service?.companyName || "Vendor";
  const customerName = booking?.buyerName || booking?.customer?.name || "Customer";
  return `Hello ${vendorName}, this is a reminder from Superadmin for booking ${booking?.id}.\nService: ${booking?.service?.serviceName || "Service"}\nCustomer: ${customerName}\nBooking Date: ${formatDate(booking?.bookingDate)}\nTotal: NPR ${formatAmount(booking?.totalAmount)}.`;
};

/**
 * wa.me expects full international digits without +.
 * Nepal 10-digit mobiles (97…/98…) need 977 prefix or WhatsApp parses leading "98" as +98 (Iran).
 */
const normalizeWhatsAppNumberForWaMe = (raw) => {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";

  if (d.startsWith("00977")) d = d.slice(5);

  while (d.startsWith("0")) d = d.slice(1);
  if (!d) return "";

  if (d.startsWith("977")) {
    return d.length >= 11 && d.length <= 15 ? d : "";
  }

  if (d.length === 10 && /^9[78]\d{8}$/.test(d)) {
    return `977${d}`;
  }

  if (d.length >= 10 && d.length <= 15) return d;

  return "";
};

const hasDialableWhatsAppNumber = (raw) => {
  const d = normalizeWhatsAppNumberForWaMe(raw);
  return d.length >= 11 && d.length <= 15;
};

const buildCustomerBookingWhatsAppText = (booking) => {
  const name = booking?.buyerName || booking?.customer?.name || "there";
  const serviceName = booking?.service?.serviceName || "your booking";
  const bookingId = booking?.id ?? "—";
  const statusLabel = prettyServiceStatus(booking?.status);
  return (
    `Hello ${name},\n\n` +
    `This is the JobPortal administration team regarding your service booking #${bookingId}.\n\n` +
    `• Service: ${serviceName}\n` +
    `• Booking date: ${formatDate(booking?.bookingDate)}\n` +
    `• Quantity: ${booking?.quantity || 1}\n` +
    `• Total: NPR ${formatAmount(booking?.totalAmount)}\n` +
    `• Current status: ${statusLabel}\n\n` +
    `If you have questions about this booking or need assistance, reply here and we will help.\n\n` +
    `Thank you for choosing JobPortal.`
  );
};

const vendorContactWhatsAppClass =
  "!shadow-none border border-emerald-500/35 !bg-emerald-600/15 text-emerald-50 hover:!bg-emerald-600/24 hover:border-emerald-400/45 focus:!ring-emerald-500/35";
const vendorContactMailClass =
  "!shadow-none border border-accent/30 !bg-accent/18 text-accent hover:!bg-accent/26 hover:border-accent/45 focus:!ring-accent/35";

export default function ServicesPage() {
  const dispatch = useDispatch();
  const bookings = useSelector(selectServiceBookingsList);
  const pagination = useSelector(selectServiceBookingsPagination);
  const loading = useSelector(selectServiceBookingsLoading);
  const fetchError = useSelector(selectServiceBookingsError);
  const updatingId = useSelector(selectServiceBookingsActionLoading);
  const actionError = useSelector(selectServiceBookingsActionError);

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [mailingId, setMailingId] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);

  const loadServiceBookings = useCallback(() => {
    dispatch(
      fetchServiceBookings({
        page,
        limit: perPage,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(appliedSearch.trim() ? { search: String(appliedSearch).trim() } : {}),
      })
    );
  }, [dispatch, appliedSearch, page, perPage, statusFilter]);

  useEffect(() => {
    loadServiceBookings();
  }, [loadServiceBookings]);

  const updateStatus = async (id, nextStatus) => {
    const result = await dispatch(
      updateServiceBookingStatusThunk({ id, nextStatus })
    );
    if (updateServiceBookingStatusThunk.fulfilled.match(result)) {
      toast.success(`Booking ${titleCase(nextStatus)} successfully.`);
    } else {
      toast.error(result.payload || "Failed to update booking.");
    }
  };

  const sendMail = async (booking) => {
    try {
      setMailingId(booking.id);
      await adminAPI.contactServiceVendorByEmail(booking.id, {
        message: "Please review and confirm this booking as soon as possible.",
      });
      toast.success("Booking reminder email sent to vendor.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send vendor mail.");
    } finally {
      setMailingId(null);
    }
  };

  const openVendorWhatsApp = (booking) => {
    const raw = booking?.vendorContact?.whatsappNumber;
    if (!raw) {
      toast.error("Vendor WhatsApp number is not available.");
      return;
    }
    const digits = normalizeWhatsAppNumberForWaMe(raw);
    if (!hasDialableWhatsAppNumber(raw)) {
      toast.error(
        "Vendor WhatsApp number looks invalid. Use country code (e.g. 977…) or full international digits."
      );
      return;
    }
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(buildServiceWhatsAppText(booking))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openCustomerWhatsApp = (booking) => {
    const raw = booking?.buyerPhone || booking?.customer?.phone;
    const digits = normalizeWhatsAppNumberForWaMe(raw);
    if (!hasDialableWhatsAppNumber(raw)) {
      toast.error(
        "Customer phone is missing or invalid for WhatsApp. Use 977… or full international format."
      );
      return;
    }
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(buildCustomerBookingWhatsAppText(booking))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const visibleBookings = useMemo(() => bookings || [], [bookings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">Services</h1>
        <p className="text-text-primary text-sm mt-1">Manage service bookings and update workflow.</p>
      </div>

      {(fetchError || actionError) && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-sm flex items-center justify-between">
          <span>{fetchError || actionError}</span>
          <Button size="sm" variant="ghost" onClick={() => dispatch(clearServiceBookingsError())}>
            Dismiss
          </Button>
        </div>
      )}

      <Card
        padding={false}
        className="border-white/[0.07] bg-linear-to-b from-white/[0.04] to-transparent p-3 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-text-secondary ring-1 ring-white/10 sm:justify-start sm:bg-transparent sm:px-0 sm:py-0 sm:ring-0">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wide sm:text-xs">
              Search &amp; filter
            </span>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 z-1 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setPage(1);
                    setAppliedSearch(search.trim());
                  }
                }}
                placeholder="Booking ID, customer, email..."
                className="w-full min-h-[44px] rounded-2xl border border-white/10 bg-input py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted shadow-inner shadow-black/25 outline-none transition-ui focus:border-accent/35 focus:ring-[3px] focus:ring-accent/20 sm:rounded-xl"
              />
            </div>
            <div className="flex min-h-[44px] gap-2 sm:contents">
              <div className="relative min-w-0 flex-1 sm:w-44 sm:shrink-0">
                <select
                  value={statusFilter}
                  aria-label="Filter by status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-full min-h-[44px] w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-input py-2.5 pl-3.5 pr-10 text-sm text-text-primary shadow-inner shadow-black/25 outline-none transition-ui focus:border-accent/35 focus:ring-[3px] focus:ring-accent/20 sm:rounded-xl sm:pl-4"
                >
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {prettyServiceStatus(status)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden
                />
              </div>
              <Button
                variant="primary"
                className="min-h-[44px] shrink-0 min-w-28 rounded-2xl px-4 max-sm:flex-none sm:rounded-xl sm:px-5"
                onClick={() => {
                  setPage(1);
                  setAppliedSearch(search.trim());
                }}
                disabled={loading}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card padding={false}>
        <div className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-white/5 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">Service booking list</h2>
          <p className="text-sm tabular-nums text-text-secondary">
            <span className="font-semibold text-text-primary">{pagination.totalItems ?? 0}</span> total
            bookings
          </p>
        </div>

        <div className="hidden lg:block overflow-x-auto px-4 sm:px-6 pb-5">
          <table className="w-full">
            <thead>
              <tr className="bg-input border-t border-b border-accent">
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent rounded-tl-xl border-l border-r border-accent/40">Service</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Customer</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Vendor</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Status</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Actions</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">
                  Contact Customer
                </th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent rounded-tr-xl border-r border-accent/40">
                  Contact Vendor
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-accent/30 text-text-primary">
                  <td className="py-3 px-3 border-l border-r border-accent/30 align-top">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 mb-2 bg-white/5">
                      {booking.service?.image ? <img src={booking.service.image} alt={booking.service?.serviceName || "Service"} className="w-full h-full object-cover" /> : null}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{booking.service?.serviceName || "Service"}</p>
                    <p className="text-xs text-text-secondary mt-1">Qty {booking.quantity || 1} · NPR {booking.totalAmount || 0}</p>
                    <p className="text-xs text-text-muted mt-1">{formatDate(booking.bookingDate)}</p>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <p className="font-medium">{booking.buyerName || booking.customer?.name || "-"}</p>
                    <p className="text-xs text-text-secondary mt-1">{booking.buyerEmail || booking.customer?.email || "-"}</p>
                    <p className="text-xs text-text-secondary mt-1">{booking.buyerPhone || booking.customer?.phone || "-"}</p>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <p className="font-medium">{booking.seller?.name || booking.service?.companyName || "-"}</p>
                    <p className="text-xs text-text-secondary mt-1">{booking.seller?.email || "-"}</p>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-text-primary capitalize">{prettyServiceStatus(booking.status)}</span>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <div className="flex flex-wrap gap-2">
                      {getBookingActions(booking.status).map((action) => (
                        <Button
                          key={action}
                          size="sm"
                          variant={action === "cancelled" ? "danger" : "secondary"}
                          onClick={() => updateStatus(booking.id, action)}
                          disabled={updatingId === booking.id || normalizeServiceStatus(booking.status) === action}
                        >
                          {updatingId === booking.id ? "Updating..." : prettyServiceStatus(action)}
                        </Button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <p className="text-xs text-text-secondary">
                      Phone: {booking.buyerPhone || booking.customer?.phone || "-"}
                    </p>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openCustomerWhatsApp(booking)}
                        disabled={!hasDialableWhatsAppNumber(booking.buyerPhone || booking.customer?.phone)}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <p className="text-xs text-text-secondary">Phone: {booking.vendorContact?.phone || "-"}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className={vendorContactWhatsAppClass}
                        onClick={() => openVendorWhatsApp(booking)}
                        disabled={!hasDialableWhatsAppNumber(booking.vendorContact?.whatsappNumber)}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className={vendorContactMailClass}
                        onClick={() => sendMail(booking)}
                        disabled={mailingId === booking.id}
                      >
                        {mailingId === booking.id ? "Sending..." : "Send Mail"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visibleBookings.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">No service bookings found.</div>
          ) : null}
        </div>

        <div className="lg:hidden px-4 pb-4 space-y-3">
          {loading && visibleBookings.length === 0 ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-14 w-14 rounded-lg shrink-0 bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 bg-white/10" />
                      <Skeleton className="h-3 w-1/2 bg-white/10" />
                      <Skeleton className="h-3 w-2/3 bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {visibleBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0">
                      {booking.service?.image ? (
                        <img
                          src={booking.service.image}
                          alt={booking.service?.serviceName || "Service"}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary line-clamp-2">
                        {booking.service?.serviceName || "Service"}
                      </p>
                      <p className="text-sm text-text-secondary mt-0.5">
                        NPR {formatAmount(booking.totalAmount)} · Qty {booking.quantity || 1}
                      </p>
                      <p className="text-xs text-text-muted mt-1">{formatDate(booking.bookingDate)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-text-primary capitalize">
                        {prettyServiceStatus(booking.status)}
                      </span>
                      <MobileDetailEyeButton
                        onClick={() => setDetailBooking(booking)}
                        aria-label="View full booking details"
                      />
                    </div>
                  </div>
                
                </div>
              ))}
              {!loading && visibleBookings.length === 0 ? (
                <div className="py-10 text-center text-text-secondary">No service bookings found.</div>
              ) : null}
            </>
          )}
        </div>

        <Pagination
          currentPage={pagination.currentPage || 1}
          totalPages={pagination.totalPages || 1}
          onPageChange={setPage}
          itemsPerPage={perPage}
          onItemsPerPageChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
          totalItems={pagination.totalItems || 0}
        />
      </Card>

      <Modal
        open={!!detailBooking}
        onClose={() => setDetailBooking(null)}
        title="Booking details"
        size="lg"
        scrollable
      >
        {detailBooking && (
          <div className="space-y-4 text-text-primary">
            <div className="flex gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0">
                {detailBooking.service?.image ? (
                  <img
                    src={detailBooking.service.image}
                    alt={detailBooking.service?.serviceName || "Service"}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{detailBooking.service?.serviceName || "Service"}</p>
                <p className="text-sm text-text-secondary mt-1">
                  Qty {detailBooking.quantity || 1} · NPR {formatAmount(detailBooking.totalAmount)}
                </p>
                <p className="text-xs text-text-muted mt-1">{formatDate(detailBooking.bookingDate)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-white/10 pt-4">
              <p className="font-semibold text-text-primary">Customer Details:</p>
              <p>Name:<strong> {detailBooking.buyerName || detailBooking.customer?.name || "—"}</strong> </p>
              <p>Email:<strong> {detailBooking.buyerEmail || detailBooking.customer?.email || "—"}</strong> </p>
              <p>Phone:<strong> {detailBooking.buyerPhone || detailBooking.customer?.phone || "—"}</strong> </p>
            </div>
            <div className="space-y-2 text-sm border-t border-white/10 pt-4">
              <p className="font-semibold text-text-primary">Vendor Details:</p>
              <p>Name:<strong> {detailBooking.seller?.name || detailBooking.service?.companyName || "—"}</strong> </p>
              <p>Email:<strong> {detailBooking.seller?.email || "—"}</strong> </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-4">
              <span className="text-sm font-semibold text-text-primary">Status:</span>
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-text-primary capitalize">
                {prettyServiceStatus(detailBooking.status)}
              </span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm font-semibold text-text-primary">Contact customer</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <p className="min-w-0 flex-1 text-sm text-text-secondary">
                  <span className="mr-2 font-medium text-text-muted">Phone</span>
                  <span className="break-all font-medium text-text-primary">
                    {detailBooking.buyerPhone || detailBooking.customer?.phone || "—"}
                  </span>
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-[44px] shrink-0 min-w-28"
                  onClick={() => openCustomerWhatsApp(detailBooking)}
                  disabled={
                    !hasDialableWhatsAppNumber(detailBooking.buyerPhone || detailBooking.customer?.phone)
                  }
                >
                  WhatsApp
                </Button>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">Contact vendor</p>
              <p>Phone:<strong> {detailBooking.vendorContact?.phone || "—"}</strong> </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className={`min-h-[44px] ${vendorContactWhatsAppClass}`}
                  onClick={() => openVendorWhatsApp(detailBooking)}
                  disabled={!hasDialableWhatsAppNumber(detailBooking.vendorContact?.whatsappNumber)}
                >
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className={`min-h-[44px] ${vendorContactMailClass}`}
                  onClick={() => sendMail(detailBooking)}
                  disabled={mailingId === detailBooking.id}
                >
                  {mailingId === detailBooking.id ? "Sending..." : "Send Mail"}
                </Button>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-sm font-semibold text-text-primary">Update status</p>
              <div className="flex flex-wrap gap-2">
                {getBookingActions(detailBooking.status).map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant={action === "cancelled" ? "danger" : "secondary"}
                    className="min-h-[44px]"
                    onClick={() => updateStatus(detailBooking.id, action)}
                    disabled={
                      updatingId === detailBooking.id ||
                      normalizeServiceStatus(detailBooking.status) === action
                    }
                  >
                    {updatingId === detailBooking.id ? "Updating..." : prettyServiceStatus(action)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
