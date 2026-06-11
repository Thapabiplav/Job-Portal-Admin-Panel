import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { X, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/modals/Modal';
import { MobileDetailEyeButton } from '../../components/mobile/MobileDetailEyeButton';
import { adminAPI } from '../../api/axios';
import { formatOrderVariantLine } from '../../utils/orderVariant';
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  selectAdminOrdersList,
  selectAdminOrdersPagination,
  selectAdminOrdersLoading,
  selectAdminOrdersError,
  selectAdminOrdersActionLoading,
  selectAdminOrdersActionError,
  clearAdminOrdersError,
} from '../../features/adminOrders/adminOrdersSlice';

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
  'cancelled',
];

const STATUS_ACTIONS = [
  { value: 'confirmed', label: 'Confirm', variant: 'primary' },
  { value: 'processing', label: ' Processing', variant: 'secondary' },
  { value: 'cancelled', label: 'Delete', variant: 'danger' },
  { value: 'shipping', label: ' Shipping', variant: 'secondary' },
  { value: 'delivered', label: ' Delivered', variant: 'secondary' },
];

const titleCase = (value = '') =>
  String(value)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value || '0');
  return num.toLocaleString('en-US');
};

const getOrderActions = (statusValue = '') => {
  const status = String(statusValue || '').toLowerCase();
  if (status === 'pending') return STATUS_ACTIONS.filter((a) => ['confirmed', 'cancelled'].includes(a.value));
  if (status === 'confirmed') return STATUS_ACTIONS.filter((a) => ['processing', 'shipping', 'delivered'].includes(a.value));
  if (status === 'processing') return STATUS_ACTIONS.filter((a) => ['shipping', 'delivered'].includes(a.value));
  if (status === 'shipping') return STATUS_ACTIONS.filter((a) => a.value === 'delivered');
  return [];
};

const buildWhatsAppText = (order) => {
  const vendorName = order?.seller?.name || order?.product?.vendor || 'Vendor';
  const buyerName = order?.buyerName || order?.buyer?.name || 'Customer';
  const variant = formatOrderVariantLine(order?.selectedColor, order?.selectedSize);
  const variantLine = variant ? `\n${variant}` : '';
  return `Hello ${vendorName}, this is a reminder from Superadmin for order ${order?.id}. Please confirm/update this order.\nProduct: ${order?.product?.name || 'Product'}${variantLine}\nCustomer: ${buyerName}\nQuantity: ${order?.quantity || 1}\nTotal: NPR ${formatAmount(order?.totalAmount)}.`;
};

/**
 * wa.me expects full international digits without +.
 * Nepal mobiles stored as 10 digits (98… / 97…) must use 977 prefix or WhatsApp parses leading "98" as +98 (Iran).
 */
const normalizeWhatsAppNumberForWaMe = (raw) => {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return '';

  if (d.startsWith('00977')) d = d.slice(5);

  while (d.startsWith('0')) d = d.slice(1);
  if (!d) return '';

  if (d.startsWith('977')) {
    return d.length >= 11 && d.length <= 15 ? d : '';
  }

  if (d.length === 10 && /^9[78]\d{8}$/.test(d)) {
    return `977${d}`;
  }

  if (d.length >= 10 && d.length <= 15) return d;

  return '';
};

const hasDialableWhatsAppNumber = (raw) => {
  const d = normalizeWhatsAppNumberForWaMe(raw);
  return d.length >= 11 && d.length <= 15;
};

const buildCustomerWhatsAppText = (order) => {
  const name = order?.buyerName || order?.buyer?.name || 'there';
  const product = order?.product?.name || 'your purchase';
  const orderId = order?.id ?? '—';
  const statusLabel = titleCase(String(order?.status || 'pending'));
  const variant = formatOrderVariantLine(order?.selectedColor, order?.selectedSize);
  const variantLine = variant ? `• ${variant}\n` : '';
  return (
    `Hello ${name},\n\n` +
    `This is the JobPortal administration team regarding your order #${orderId}.\n\n` +
    `• Product: ${product}\n` +
    variantLine +
    `• Quantity: ${order?.quantity || 1}\n` +
    `• Total: NPR ${formatAmount(order?.totalAmount)}\n` +
    `• Current status: ${statusLabel}\n\n` +
    `If you have questions about this order, delivery, or need assistance, reply here and we will help.\n\n` +
    `Thank you for choosing JobPortal.`
  );
};

/** Muted styles for contact vendor row (avoid loud primary gradient on mail). */
const vendorContactWhatsAppClass =
  '!shadow-none border border-emerald-500/35 !bg-emerald-600/15 text-emerald-50 hover:!bg-emerald-600/24 hover:border-emerald-400/45 focus:!ring-emerald-500/35';
const vendorContactMailClass =
  '!shadow-none border border-accent/30 !bg-accent/18 text-accent hover:!bg-accent/26 hover:border-accent/45 focus:!ring-accent/35';

export default function OrdersPage() {
  const dispatch = useDispatch();
  const orders = useSelector(selectAdminOrdersList);
  const pagination = useSelector(selectAdminOrdersPagination);
  const loading = useSelector(selectAdminOrdersLoading);
  const fetchError = useSelector(selectAdminOrdersError);
  const updatingOrderId = useSelector(selectAdminOrdersActionLoading);
  const actionError = useSelector(selectAdminOrdersActionError);

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pendingAction, setPendingAction] = useState(null);
  const [mailingOrderId, setMailingOrderId] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const loadOrders = useCallback(() => {
    dispatch(
      fetchAdminOrders({
        page,
        limit: perPage,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(appliedSearch.trim() ? { search: appliedSearch.trim() } : {}),
      })
    );
  }, [dispatch, page, perPage, appliedSearch, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (orderId, nextStatus) => {
    const result = await dispatch(
      updateAdminOrderStatus({ orderId, nextStatus })
    );
    if (updateAdminOrderStatus.fulfilled.match(result)) {
      toast.success(`Order ${titleCase(nextStatus)} successfully.`);
    } else {
      toast.error(result.payload || 'Failed to update order.');
    }
  };

  const openActionConfirm = (orderId, nextStatus) => {
    setPendingAction({ orderId, nextStatus });
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    await handleStatusUpdate(pendingAction.orderId, pendingAction.nextStatus);
    setPendingAction(null);
  };

  const handleContactVendorMail = async (order) => {
    try {
      setMailingOrderId(order.id);
      await adminAPI.contactVendorByEmail(order.id, {
        message:
          'Please review and confirm this order as soon as possible. Contact the customer if any clarification is needed.',
      });
      toast.success('Order reminder email sent to vendor.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send vendor mail.');
    } finally {
      setMailingOrderId(null);
    }
  };

  const openVendorWhatsApp = (order) => {
    const raw = order?.vendorContact?.whatsappNumber;
    if (!raw) {
      toast.error('Vendor WhatsApp number is not available.');
      return;
    }
    const digits = normalizeWhatsAppNumberForWaMe(raw);
    if (!hasDialableWhatsAppNumber(raw)) {
      toast.error('Vendor WhatsApp number looks invalid. Use country code (e.g. 977…) or full international digits.');
      return;
    }
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(buildWhatsAppText(order))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openCustomerWhatsApp = (order) => {
    const raw = order?.buyerPhone || order?.buyer?.phone;
    const digits = normalizeWhatsAppNumberForWaMe(raw);
    if (!hasDialableWhatsAppNumber(raw)) {
      toast.error('Customer phone is missing or invalid for WhatsApp. Use 977… or full international format.');
      return;
    }
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(buildCustomerWhatsAppText(order))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const visibleOrders = useMemo(() => orders || [], [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">Orders</h1>
        <p className="text-text-primary text-sm mt-1">
          Manage marketplace orders and update delivery workflow.
        </p>
      </div>

      {(fetchError || actionError) && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-sm flex items-center justify-between">
          <span>{fetchError || actionError}</span>
          <Button size="sm" variant="ghost" onClick={() => dispatch(clearAdminOrdersError())}>
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
            <span className="text-[11px] font-semibold uppercase tracking-wide sm:text-xs">Search &amp; filter</span>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 z-1 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setPage(1);
                    setAppliedSearch(search.trim());
                  }
                }}
                placeholder="Order ID, buyer, email..."
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
                      {titleCase(status)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
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
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">Order list</h2>
          <p className="text-sm tabular-nums text-text-secondary">
            <span className="font-semibold text-text-primary">{pagination.totalItems ?? 0}</span>
            {' '}total orders
          </p>
        </div>

        <div className="hidden lg:block overflow-x-auto px-4 sm:px-6 pb-5">
          <table className="w-full">
            <thead>
              <tr className="bg-input border-t border-b border-accent">
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent rounded-tl-xl border-l border-r border-accent/40">Order</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Customer</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Vendor</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Status</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Actions</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Contact Customer</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent rounded-tr-xl border-r border-accent/40">Contact Vendor</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.id} className="border-b border-accent/30 text-text-primary">
                  <td className="py-3 px-3 border-l border-r border-accent/30 align-top">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 mb-2 bg-white/5">
                      {order.product?.image ? (
                        <img
                          src={order.product.image}
                          alt={order.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      {order.product?.name || 'Product'}
                    </p>
                    {formatOrderVariantLine(order.selectedColor, order.selectedSize) ? (
                      <p className="text-xs text-text-secondary mt-1">
                        {formatOrderVariantLine(order.selectedColor, order.selectedSize)}
                      </p>
                    ) : null}
                    <p className="text-xs text-text-secondary mt-1">
                      Qty {order.quantity || 1} · NPR {formatAmount(order.totalAmount)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{formatDate(order.orderedAt)}</p>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <p className="font-medium">{order.buyerName || order.buyer?.name || '-'}</p>
                    <p className="text-xs text-text-secondary mt-1">{order.buyerEmail || order.buyer?.email || '-'}</p>
                    <p className="text-xs text-text-secondary mt-1">{order.buyerPhone || order.buyer?.phone || '-'}</p>
                    <p className="text-xs text-text-secondary mt-1">{order.buyerAddress || order.buyer?.address || '-'}</p>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <p className="font-medium">{order.seller?.name || order.product?.vendor || '-'}</p>
                    <p className="text-xs text-text-secondary mt-1">{order.seller?.email || '-'}</p>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-text-primary capitalize">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <div className="flex flex-wrap gap-2">
                      {getOrderActions(order.status).map((action) => {
                        const disabled =
                          updatingOrderId === order.id || order.status === action.value;
                        return (
                          <Button
                            key={action.value}
                            size="sm"
                            variant={action.variant}
                            onClick={() => openActionConfirm(order.id, action.value)}
                            disabled={disabled}
                          >
                            {updatingOrderId === order.id ? 'Updating...' : action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <p className="text-xs text-text-secondary">
                      Phone: {order.buyerPhone || order.buyer?.phone || '-'}
                    </p>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openCustomerWhatsApp(order)}
                        disabled={
                          !hasDialableWhatsAppNumber(order.buyerPhone || order.buyer?.phone)
                        }
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </td>
                  <td className="py-3 px-3 border-r border-accent/30 align-top">
                    <p className="text-xs text-text-secondary">Phone: {order.vendorContact?.phone || '-'}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className={vendorContactWhatsAppClass}
                        onClick={() => openVendorWhatsApp(order)}
                        disabled={!hasDialableWhatsAppNumber(order.vendorContact?.whatsappNumber)}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className={vendorContactMailClass}
                        onClick={() => handleContactVendorMail(order)}
                        disabled={mailingOrderId === order.id}
                      >
                        {mailingOrderId === order.id ? 'Sending...' : 'Send Mail'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visibleOrders.length === 0 && (
            <div className="py-12 text-center text-text-secondary">No orders found.</div>
          )}
        </div>

        <div className="lg:hidden px-4 pb-4 space-y-3">
          {visibleOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0">
                  {order.product?.image ? (
                    <img
                      src={order.product.image}
                      alt={order.product?.name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary line-clamp-2">
                    {order.product?.name || 'Product'}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {order.buyerName || order.buyer?.name || '—'}
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    Qty {order.quantity || 1} · NPR {formatAmount(order.totalAmount)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(order.orderedAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-text-primary capitalize">
                    {order.status}
                  </span>
                  <MobileDetailEyeButton
                    onClick={() => setDetailOrder(order)}
                    aria-label="View full order details"
                  />
                </div>
              </div>
            </div>
          ))}
          {!loading && visibleOrders.length === 0 && (
            <div className="py-10 text-center text-text-secondary">No orders found.</div>
          )}
        </div>

        <Modal
          open={!!detailOrder}
          onClose={() => setDetailOrder(null)}
          title="Order details"
          size="lg"
          scrollable
        >
          {detailOrder && (
            <div className="space-y-4 text-text-primary">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0">
                  {detailOrder.product?.image ? (
                    <img
                      src={detailOrder.product.image}
                      alt={detailOrder.product?.name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{detailOrder.product?.name || 'Product'}</p>
                  {formatOrderVariantLine(detailOrder.selectedColor, detailOrder.selectedSize) ? (
                    <p className="text-sm text-text-secondary mt-1">
                      {formatOrderVariantLine(detailOrder.selectedColor, detailOrder.selectedSize)}
                    </p>
                  ) : null}
                  <p className="text-sm text-text-secondary mt-1">
                    Qty {detailOrder.quantity || 1} · NPR {formatAmount(detailOrder.totalAmount)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{formatDate(detailOrder.orderedAt)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm border-t border-white/10 pt-4">
                <p className="font-semibold text-text-primary">Customer Details:</p>
                <p>Name:<strong> {detailOrder.buyerName || detailOrder.buyer?.name || '—'}</strong> </p>
                <p>Email:<strong> {detailOrder.buyerEmail || detailOrder.buyer?.email || '—'}</strong> </p>
                <p>Phone:<strong> {detailOrder.buyerPhone || detailOrder.buyer?.phone || '—'}</strong> </p>
                <p>Address:<strong> {detailOrder.buyerAddress || detailOrder.buyer?.address || '—'}</strong> </p>
              </div>
              <div className="space-y-2 text-sm border-t border-white/10 pt-4">
                <p className="font-semibold text-text-primary">Vendor Details:</p>
                  <p>Name:<strong>{detailOrder.seller?.name || detailOrder.product?.vendor || '—'}</strong> </p>    
                <p>Email: <strong> {detailOrder.seller?.email || '—'}</strong> </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-4">
                <span className="text-sm font-semibold text-text-primary">Status:</span>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-text-primary capitalize">
                  {detailOrder.status}
                </span>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm font-semibold text-text-primary">Contact customer</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <p className="min-w-0 flex-1 text-sm text-text-secondary">
                    <span className="mr-2 font-medium text-text-muted">Phone</span>
                    <span className="break-all font-medium text-text-primary">
                      {detailOrder.buyerPhone || detailOrder.buyer?.phone || '—'}
                    </span>
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-[44px] shrink-0 min-w-28"
                    onClick={() => openCustomerWhatsApp(detailOrder)}
                    disabled={
                      !hasDialableWhatsAppNumber(detailOrder.buyerPhone || detailOrder.buyer?.phone)
                    }
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="text-sm font-semibold text-text-primary">Contact vendor</p>
                        <p>Phone:<strong> {detailOrder.vendorContact?.phone || '—'}</strong> </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className={`min-h-[44px] ${vendorContactWhatsAppClass}`}
                    onClick={() => openVendorWhatsApp(detailOrder)}
                    disabled={!hasDialableWhatsAppNumber(detailOrder.vendorContact?.whatsappNumber)}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className={`min-h-[44px] ${vendorContactMailClass}`}
                    onClick={() => handleContactVendorMail(detailOrder)}
                    disabled={mailingOrderId === detailOrder.id}
                  >
                    {mailingOrderId === detailOrder.id ? 'Sending...' : 'Send Mail'}
                  </Button>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 space-y-2">
                <p className="text-sm font-semibold text-text-primary">Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {getOrderActions(detailOrder.status).map((action) => {
                    const disabled =
                      updatingOrderId === detailOrder.id || detailOrder.status === action.value;
                    return (
                      <Button
                        key={action.value}
                        size="sm"
                        variant={action.variant}
                        className="min-h-[44px]"
                        onClick={() => {
                          openActionConfirm(detailOrder.id, action.value);
                          setDetailOrder(null);
                        }}
                        disabled={disabled}
                      >
                        {updatingOrderId === detailOrder.id ? 'Updating...' : action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Modal>

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

      {pendingAction && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-soft p-5 shadow-(--shadow-card) text-center">
            <button
              type="button"
              aria-label="Close confirmation"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-text-secondary transition hover:bg-white/10 hover:text-text-primary"
              onClick={() => setPendingAction(null)}
              disabled={updatingOrderId === pendingAction.orderId}
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold text-text-primary">
              Confirm action
            </h3>
            <p className="text-sm text-text-secondary mt-2">
              Do you want to {titleCase(pendingAction.nextStatus)} this order?
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant={pendingAction.nextStatus === 'cancelled' ? 'danger' : 'primary'}
                onClick={confirmPendingAction}
                disabled={updatingOrderId === pendingAction.orderId}
              >
                {updatingOrderId === pendingAction.orderId ? 'Updating...' : 'Yes'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPendingAction(null)}
                disabled={updatingOrderId === pendingAction.orderId}
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
