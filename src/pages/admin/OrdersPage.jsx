import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { adminAPI } from '../../api/axios';

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
  return `Hello ${vendorName}, this is a reminder from Superadmin for order ${order?.id}. Please confirm/update this order.\nProduct: ${order?.product?.name || 'Product'}\nCustomer: ${buyerName}\nQuantity: ${order?.quantity || 1}\nTotal: NPR ${formatAmount(order?.totalAmount)}.`;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [mailingOrderId, setMailingOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getOrders({
        page,
        limit: perPage,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setOrders(res.data?.data || []);
      setPagination(
        res.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: perPage,
        },
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (orderId, nextStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await adminAPI.updateOrderStatus(orderId, nextStatus);
      const updated = res.data?.data;
      setOrders((prev) =>
        prev.map((item) =>
          item.id === orderId ? { ...item, status: updated?.status || nextStatus } : item,
        ),
      );
      toast.success(`Order ${titleCase(nextStatus)} successfully.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update order.');
    } finally {
      setUpdatingOrderId(null);
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
    const whatsappNo = order?.vendorContact?.whatsappNumber;
    if (!whatsappNo) {
      toast.error('Vendor WhatsApp number is not available.');
      return;
    }
    const url = `https://wa.me/${whatsappNo}?text=${encodeURIComponent(buildWhatsAppText(order))}`;
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

      <Card>
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, buyer name, or buyer email..."
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
                    {titleCase(status)}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={() => {
              setPage(1);
              loadOrders();
            }}
            disabled={loading}
          >
            Search
          </Button>
        </div>
      </Card>

      <Card padding={false}>
        <CardHeader
          title="Order list"
          subtitle={`${pagination.totalItems || 0} total orders`}
          className="px-4 sm:px-6 pt-4 sm:pt-6"
        />

        <div className="hidden lg:block overflow-x-auto px-4 sm:px-6 pb-5">
          <table className="w-full">
            <thead>
              <tr className="bg-input border-t border-b border-accent">
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent rounded-tl-xl border-l border-r border-accent/40">Order</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Customer</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Vendor</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Status</th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-accent border-r border-accent/40">Actions</th>
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
                    <p className="text-xs text-text-secondary">Phone: {order.vendorContact?.phone || '-'}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openVendorWhatsApp(order)}
                        disabled={!order.vendorContact?.whatsappNumber}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-text-secondary mt-1">{order.product?.name || 'Product'}</p>
                  <div className="mt-2 w-full h-36 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                    {order.product?.image ? (
                      <img
                        src={order.product.image}
                        alt={order.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-text-primary capitalize">
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-text-secondary space-y-1">
                <p>Customer: {order.buyerName || order.buyer?.name || '-'}</p>
                <p>Email: {order.buyerEmail || order.buyer?.email || '-'}</p>
                <p>Phone: {order.buyerPhone || order.buyer?.phone || '-'}</p>
                <p>Address: {order.buyerAddress || order.buyer?.address || '-'}</p>
                <p>Vendor: {order.seller?.name || order.product?.vendor || '-'}</p>
                <p>Qty {order.quantity || 1} · NPR {formatAmount(order.totalAmount)}</p>
                <p>{formatDate(order.orderedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary mb-1">Contact Vendor</p>
                <p className="text-xs text-text-secondary">Phone: {order.vendorContact?.phone || '-'}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-[44px]"
                    onClick={() => openVendorWhatsApp(order)}
                    disabled={!order.vendorContact?.whatsappNumber}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="min-h-[44px]"
                    onClick={() => handleContactVendorMail(order)}
                    disabled={mailingOrderId === order.id}
                  >
                    {mailingOrderId === order.id ? 'Sending...' : 'Send Mail'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {getOrderActions(order.status).map((action) => {
                  const disabled =
                    updatingOrderId === order.id || order.status === action.value;
                  return (
                    <Button
                      key={action.value}
                      size="sm"
                      variant={action.variant}
                      className="min-h-[44px]"
                      onClick={() => openActionConfirm(order.id, action.value)}
                      disabled={disabled}
                    >
                      {updatingOrderId === order.id ? 'Updating...' : action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
          {!loading && visibleOrders.length === 0 && (
            <div className="py-10 text-center text-text-secondary">No orders found.</div>
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

      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
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
