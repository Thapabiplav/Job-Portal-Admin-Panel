import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
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

  const loadServiceBookings = useCallback(() => {
    dispatch(
      fetchServiceBookings({
        page,
        limit: perPage,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(appliedSearch.trim() ? { search: appliedSearch.trim() } : {}),
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
    const whatsappNo = booking?.vendorContact?.whatsappNumber;
    if (!whatsappNo) {
      toast.error("Vendor WhatsApp number is not available.");
      return;
    }
    const url = `https://wa.me/${whatsappNo}?text=${encodeURIComponent(buildServiceWhatsAppText(booking))}`;
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

      <Card>
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ID, customer name, or customer email..."
            className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-input border border-white/10 text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-ui"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-xl border border-white/10 bg-input text-text-primary min-h-[44px] focus:ring-2 focus:ring-accent transition-ui"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {prettyServiceStatus(status)}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={() => {
              setPage(1);
              setAppliedSearch(search);
            }}
            disabled={loading}
          >
            Search
          </Button>
        </div>
      </Card>

      <Card padding={false}>
        <CardHeader
          title="Service booking list"
          subtitle={`${pagination.totalItems || 0} total bookings`}
          className="px-4 sm:px-6 pt-4 sm:pt-6"
        />

        <div className="hidden lg:block overflow-x-auto px-4 sm:px-6 pb-5">
          <table className="w-full">
            <thead>
              <tr className="bg-input border-t border-b border-accent">
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent rounded-tl-xl border-l border-r border-accent/40">Service</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Customer</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Vendor</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Status</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Actions</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent rounded-tr-xl border-r border-accent/40">Contact Vendor</th>
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
                    <p className="text-xs text-text-secondary">Phone: {booking.vendorContact?.phone || "-"}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openVendorWhatsApp(booking)}
                        disabled={!booking.vendorContact?.whatsappNumber}
                      >
                        WhatsApp
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => sendMail(booking)} disabled={mailingId === booking.id}>
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
    </div>
  );
}
