import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  fetchCandidateVerifications,
  verifyCandidate,
  selectCvList,
  selectCvPagination,
  selectCvLoading,
  selectCvError,
  selectCvActionLoading,
  selectCvActionError,
  clearCandidateVerificationErrors,
} from '../features/candidateVerifications/candidateVerificationsSlice';
import { Card } from '../components/ui/Card';
import { MobileDetailEyeButton } from '../components/mobile/MobileDetailEyeButton';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { StatCard } from '../components/cards/StatCard';
import { Skeleton } from '../components/ui/Skeleton';
import { UserCheck, Clock, ShieldCheck } from 'lucide-react';
import { ProfileViewActions } from '../components/admin/ProfileViewActions';

const statIconSize = 'w-5 h-5';

const verifyButtonClassName =
  'gap-2 px-4 sm:px-5 font-semibold tracking-wide shadow-[0_4px_24px_rgba(167,139,250,0.35)] ring-2 ring-white/20 hover:ring-accent/50 hover:shadow-[0_6px_28px_rgba(167,139,250,0.45)] active:scale-[0.98] transition-transform';

export default function CandidateVerification() {
  const dispatch = useDispatch();
  const list = useSelector(selectCvList);
  const pagination = useSelector(selectCvPagination);
  const loading = useSelector(selectCvLoading);
  const error = useSelector(selectCvError);
  const actionLoading = useSelector(selectCvActionLoading);
  const actionError = useSelector(selectCvActionError);

  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const load = useCallback(() => {
    dispatch(
      fetchCandidateVerifications({
        page,
        limit: perPage,
        status: filter,
      })
    );
  }, [dispatch, page, perPage, filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setExpandedRowId(null);
  }, [filter, page]);

  const handleVerify = async (cvId) => {
    const result = await dispatch(verifyCandidate(cvId));
    if (verifyCandidate.fulfilled.match(result)) {
      toast.success('User approved successfully');
    } else {
      toast.error(
        result.payload ||
          'Failed to approve user request.',
      );
    }
  };

  const totalPages = pagination.totalPages || 1;

  const tabClass = (active) =>
    `min-h-[44px] px-4 py-2 rounded-xl font-medium transition-ui tap-feedback ${
      active
        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-[var(--shadow-glow)]'
        : 'bg-surface-soft border border-white/10 text-text-secondary hover:bg-hover hover:text-text-primary'
    }`;

  const pendingCount = list.filter((item) => item.status === 'pending').length;
  const verifiedCount = list.filter((item) => item.status === 'verified').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">
          Approve Users
        </h1>
        <p className="text-text-primary text-sm mt-1">
          Verify candidate requests for product and service listings
        </p>
      </div>

      <section className="grid grid-cols-2 gap-2 md:gap-4">
        <StatCard
          compact
          title={
            <>
              <span className="md:hidden">Verified</span>
              <span className="hidden md:inline">Verified Users</span>
            </>
          }
          value={verifiedCount}
          icon={<UserCheck className={statIconSize} />}
        />
        <StatCard
          compact
          title={
            <>
              <span className="md:hidden">Pending</span>
              <span className="hidden md:inline">Pending Requests</span>
            </>
          }
          value={pendingCount}
          icon={<Clock className={statIconSize} />}
        />
      </section>

      <div className="flex flex-wrap gap-2" role="tablist">
        <button
          type="button"
          onClick={() => {
            setFilter('pending');
            setPage(1);
          }}
          className={tabClass(filter === 'pending')}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter('verified');
            setPage(1);
          }}
          className={tabClass(filter === 'verified')}
        >
          Verified
        </button>
        <button
          type="button"
          onClick={() => {
            setFilter('unverified');
            setPage(1);
          }}
          className={tabClass(filter === 'unverified')}
        >
          Unverified
        </button>
      </div>

      {(error || actionError) && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-sm flex items-center justify-between">
          <span>{error || actionError}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch(clearCandidateVerificationErrors())}
          >
            Dismiss
          </Button>
        </div>
      )}

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
                      Candidate
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
                  {list.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-accent/40 text-[#FFFFFF] transition-shadow admin-table-row-hover hover:bg-hover/30"
                    >
                      <td className="py-3 px-4 border-r border-accent/40">
                        <div className="space-y-1">
                          <span className="block font-medium text-[#FFFFFF]">
                            {row.user?.name || row.fullName || '—'}
                          </span>
                          <span className="block break-all text-sm text-text-secondary">
                            {row.user?.email || row.email || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-r border-accent/40">
                        <Badge
                          variant={row.status === 'verified' ? 'success' : 'warning'}
                        >
                          {row.status === 'verified' ? 'Verified' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 border-r-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <ProfileViewActions
                            slug={row.user?.cvSlug}
                            variant="desktop"
                          />
                          {row.status !== 'verified' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleVerify(row.id)}
                              disabled={actionLoading === row.id}
                              className={verifyButtonClassName}
                            >
                              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                              Verify
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-white/10">
              {list.map((row) => {
                const expanded = expandedRowId === row.id;
                return (
                  <div key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-primary line-clamp-2 pr-1">
                          {row.user?.name || row.fullName || '—'}
                        </p>
                        <div className="mt-2">
                          <Badge variant={row.status === 'verified' ? 'success' : 'warning'}>
                            {row.status === 'verified' ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                      <MobileDetailEyeButton
                        expanded={expanded}
                        onClick={() =>
                          setExpandedRowId((id) => (id === row.id ? null : row.id))
                        }
                        aria-label={expanded ? 'Hide contact details' : 'Show contact details'}
                      />
                    </div>
                    <div className="mt-3 flex min-h-[44px] flex-wrap items-center gap-5">
                      <ProfileViewActions
                        slug={row.user?.cvSlug}
                        variant="mobile"
                      />
                      {row.status !== 'verified' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleVerify(row.id)}
                          disabled={actionLoading === row.id}
                          className={`min-h-[44px] shrink-0 ${verifyButtonClassName}`}
                        >
                          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                          Verify
                        </Button>
                      )}
                    </div>
                    {expanded && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/3 px-3 py-3 space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            Name
                          </p>
                          <p className="mt-1 text-sm text-text-primary">
                            {row.user?.name || row.fullName || '—'}
                          </p>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            Email
                          </p>
                          <p className="mt-1 break-all text-sm text-text-primary">
                            {row.user?.email || row.email || '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted mb-4">
                  <UserCheck className="w-8 h-8" />
                </div>
                <p className="text-text-primary font-medium">
                  No user verification requests found
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Try a different filter
                </p>
              </div>
            )}
          </>
        )}

        {((pagination.totalItems ?? 0) > 0 || totalPages >= 1) && (
          <Pagination
            currentPage={pagination.currentPage || 1}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={perPage}
            onItemsPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
            totalItems={pagination.totalItems}
          />
        )}
      </Card>

    </div>
  );
}
