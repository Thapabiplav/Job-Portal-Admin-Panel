import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Smartphone } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  fetchAppDownloads,
  selectAppDownloadBucket,
} from '../../features/appDownloads/appDownloadsSlice';

function callHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const local = digits.startsWith("977") ? digits : `977${digits}`;
  return `tel:+${local}`;
}

function formatSubmitted(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LeadList({ audience, title, subtitle }) {
  const dispatch = useDispatch();
  const bucket = useSelector(selectAppDownloadBucket(audience));
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchAppDownloads({ audience, page, limit: perPage }));
  }, [dispatch, audience, page, perPage]);

  const list = bucket?.list ?? [];
  const pagination = bucket?.pagination;
  const loading = bucket?.isLoading;
  const error = bucket?.error;

  return (
    <Card padding={false}>
      <div className="p-4 sm:p-5 border-b border-white/5">
        <CardHeader title={title} subtitle={subtitle} />
      </div>
      {error ? (
        <div className="m-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-sm">
          {error}
        </div>
      ) : null}
      {loading && !list.length ? (
        <div className="p-4 sm:p-6 space-y-3">
          {[1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="p-6 text-sm text-text-secondary">No phone numbers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-input border-b border-accent">
                <th className="text-left py-4 px-4 text-sm font-semibold text-accent">Phone</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-accent">Email</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-accent">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {list.map((lead) => {
                const href = callHref(lead.phone);
                return (
                <tr key={lead.id} className="border-b border-accent/40 text-text-primary">
                  <td className="py-3 px-4 font-medium text-[#FFFFFF]">
                    {href ? (
                      <a
                        href={href}
                        className="text-accent underline underline-offset-2 hover:text-white"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      lead.phone
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#FFFFFF]">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-accent underline underline-offset-2 hover:text-white"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#FFFFFF]">{formatSubmitted(lead.createdAt)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pagination?.totalItems > 0 ? (
        <div className="p-4">
          <Pagination
            currentPage={pagination.currentPage || page}
            totalPages={pagination.totalPages || 1}
            onPageChange={setPage}
            itemsPerPage={perPage}
            onItemsPerPageChange={(next) => {
              setPerPage(next);
              setPage(1);
            }}
            totalItems={pagination.totalItems}
          />
        </div>
      ) : null}
    </Card>
  );
}

const PAGE_COPY = {
  driver: {
    title: "Driver",
    subtitle: "Phone numbers, and email when someone adds it, collected before the driver app download.",
    listTitle: "Driver numbers",
    listSubtitle: "People who requested the driver app",
  },
  passenger: {
    title: "Passenger",
    subtitle: "Phone numbers, and email when someone adds it, collected before the passenger app download.",
    listTitle: "Passenger numbers",
    listSubtitle: "People who requested the passenger app",
  },
};

export default function AppDownloadsPage({ audience }) {
  const copy = PAGE_COPY[audience] || PAGE_COPY.passenger;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Smartphone className="w-6 h-6 text-accent mt-1 shrink-0" aria-hidden />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">{copy.title}</h1>
          <p className="text-text-primary text-sm mt-1">{copy.subtitle}</p>
        </div>
      </div>
      <LeadList
        key={audience}
        audience={audience}
        title={copy.listTitle}
        subtitle={copy.listSubtitle}
      />
    </div>
  );
}
