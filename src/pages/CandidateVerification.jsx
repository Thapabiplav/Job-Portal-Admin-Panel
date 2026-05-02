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
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { StatCard } from '../components/cards/StatCard';
import { Skeleton } from '../components/ui/Skeleton';
import { UserCheck, Clock } from 'lucide-react';

const statIconSize = 'w-5 h-5';

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

      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          title="Verified Users"
          value={verifiedCount}
          icon={<UserCheck className={statIconSize} />}
        />
        <StatCard
          title="Pending Requests"
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
                  {list.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-accent/40 text-[#FFFFFF] transition-shadow admin-table-row-hover hover:bg-hover/30"
                    >
                      <td className="py-3 px-4 border-r border-accent/40">
                        <span className="font-medium text-[#FFFFFF]">
                          {row.user?.name || row.fullName || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#FFFFFF] border-r border-accent/40">
                        {row.user?.email || row.email || '—'}
                      </td>
                      <td className="py-3 px-4 border-r border-accent/40">
                        <Badge
                          variant={row.status === 'verified' ? 'success' : 'warning'}
                        >
                          {row.status === 'verified' ? 'Verified' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 border-r-0">
                        {row.status !== 'verified' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleVerify(row.id)}
                            disabled={actionLoading === row.id}
                          >
                            Verify
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {list.map((row) => (
                <div key={row.id} className="p-4">
                  <p className="font-semibold text-text-primary">
                    {row.user?.name || row.fullName || '—'}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {row.user?.email || row.email || '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={row.status === 'verified' ? 'success' : 'warning'}>
                      {row.status === 'verified' ? 'Verified' : 'Pending'}
                    </Badge>
                    {row.status !== 'verified' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleVerify(row.id)}
                        disabled={actionLoading === row.id}
                        className="min-h-[44px]"
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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
