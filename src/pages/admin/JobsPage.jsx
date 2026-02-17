import { useState, useEffect, useCallback, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchJobs,
  deleteJob,
  selectJobsList,
  selectJobsPagination,
  selectJobsLoading,
  selectJobsError,
  selectJobsActionLoading,
  clearJobsError,
} from '../../features/jobs/jobsSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/modals/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { ApplicationStatusBadge } from '../../components/ui/ApplicationStatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Briefcase, Trash2, ExternalLink, User } from 'lucide-react';
const CLIENT_BASE = import.meta.env.VITE_CLIENT_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const APP_STAT_KEYS = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];
const APP_STAT_SHORT = { pending: 'Pend', reviewed: 'Rev', shortlisted: 'Short', accepted: 'Acc', rejected: 'Rej' };

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function JobsPage() {
  const dispatch = useDispatch();
  const list = useSelector(selectJobsList);
  const pagination = useSelector(selectJobsPagination);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const actionLoading = useSelector(selectJobsActionLoading);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);

  const load = useCallback(() => {
    dispatch(
      fetchJobs({
        page,
        limit: perPage,
        ...(search.trim() && { search: search.trim() }),
      })
    );
  }, [dispatch, page, perPage, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteConfirm = async () => {
    if (!deleteModal?.id) return;
    const result = await dispatch(deleteJob(deleteModal.id));
    if (deleteJob.fulfilled.match(result)) {
      toast.success('Job deleted successfully');
      setDeleteModal(null);
      if (expandedJobId === deleteModal.id) setExpandedJobId(null);
    }
  };

  const totalPages = pagination.totalPages || 1;
  const applications = (job) => job.applications || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">Jobs</h1>
        <p className="text-text-primary text-sm mt-1">Moderate job listings and view applicant activity</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="search"
            placeholder="Search by title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
            className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-input border border-white/10 text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-ui"
          />
          <Button
            variant="primary"
            onClick={() => {
              setPage(1);
              dispatch(
                fetchJobs({
                  page: 1,
                  limit: perPage,
                  ...(search.trim() && { search: search.trim() }),
                })
              );
            }}
            disabled={loading}
          >
            Search
          </Button>
        </div>
      </Card>

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => dispatch(clearJobsError())}>Dismiss</Button>
        </div>
      )}

      <Card padding={false}>
        {loading && !list.length ? (
          <div className="p-4 sm:p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl overflow-hidden">
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="bg-input border-b border-accent">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent rounded-tl-xl border-r border-accent/40">Job</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent border-r border-accent/40">Company</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent border-r border-accent/40">Posted</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent border-r border-accent/40">Applications</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent rounded-tr-xl border-r-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((job) => {
                    const apps = applications(job);
                    const isExpanded = expandedJobId === job.id;
                    return (
                      <Fragment key={job.id}>
                        <tr
                          key={job.id}
                          className={`border-b border-accent/40 text-[#FFFFFF] transition-shadow ${isExpanded ? 'bg-primary/10' : 'admin-table-row-hover hover:bg-hover/30'}`}
                        >
                          <td className="py-3 px-4 border-r border-accent/40">
                            <button
                              type="button"
                              onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                              className="flex items-center gap-2 text-left w-full group"
                            >
                              <span className="font-medium text-[#FFFFFF] group-hover:text-accent transition-ui">{job.title}</span>
                              {job.type && (
                                <Badge variant="default" className="shrink-0">{job.type}</Badge>
                              )}
                              <span className="ml-1 text-slate-400">
                                {apps.length > 0 ? (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-[#FFFFFF] border-r border-accent/40">{job.company}</td>
                          <td className="py-3 px-4 text-text-secondary text-sm border-r border-accent/40">
                            {formatDate(job.postedAt)}
                          </td>
                          <td className="py-3 px-4 border-r border-accent/40">
                            <span className="font-semibold text-[#FFFFFF]">{job.applicationCount ?? 0}</span>
                            {job.applicationStats && (
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-text-muted mt-0.5">
                                {APP_STAT_KEYS.map((key) => (
                                  <span key={key}>
                                    {APP_STAT_SHORT[key]}: {job.applicationStats[key] ?? 0}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r-0">
                            <div className="flex items-center gap-2">
                              {job.employer?.cvSlug && (
                                <a
                                  href={`${CLIENT_BASE.replace(/\/+$/, '')}/${job.employer.cvSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-lg border border-white/10 bg-input text-text-primary text-sm font-medium hover:bg-hover hover:border-accent/30 transition-ui"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  View profile
                                </a>
                              )}
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setDeleteModal({ id: job.id, title: job.title })}
                                disabled={actionLoading === job.id}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${job.id}-exp`} className="bg-hover/30 border-b border-accent/40 text-[#FFFFFF]">
                            <td colSpan={5} className="py-4 px-4 border-r-0">
                              <div className="pl-4 border-l-2 border-primary/30 rounded-r-lg">
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Applicants</p>
                                {apps.length === 0 ? (
                                  <p className="text-sm text-slate-500">No applications yet.</p>
                                ) : (
                                  <ul className="space-y-2">
                                    {apps.map((app) => (
                                      <li
                                        key={app.id}
                                        className="flex flex-wrap items-center gap-3 py-2.5 px-3 rounded-xl bg-surface-soft border border-white/5"
                                      >
                                        <Avatar name={app.applicant?.name} email={app.applicant?.email} size="sm" />
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-text-primary truncate">{app.applicant?.name || app.applicant?.email || '—'}</p>
                                          {app.applicant?.email && app.applicant?.name && (
                                            <p className="text-xs text-text-muted truncate">{app.applicant.email}</p>
                                          )}
                                          <p className="text-xs text-text-muted mt-0.5">Applied: {formatDate(app.appliedAt)}</p>
                                        </div>
                                        <ApplicationStatusBadge status={app.status} />
                                        {app.applicant?.cvSlug && (
                                          <a
                                            href={`${CLIENT_BASE.replace(/\/+$/, '')}/${app.applicant.cvSlug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-lg border border-white/10 bg-input text-text-primary text-sm font-medium hover:bg-hover hover:border-accent/30 transition-ui shrink-0"
                                          >
                                            <User className="w-3.5 h-3.5" />
                                            View profile
                                          </a>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-white/5">
              {list.map((job) => {
                const apps = applications(job);
                const isExpanded = expandedJobId === job.id;
                return (
                  <div
                    key={job.id}
                    className="p-4 transition-ui"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className="w-full text-left rounded-xl p-3 -m-1 hover:bg-hover active:bg-white/10 transition-ui tap-feedback"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary">{job.title}</p>
                          <p className="text-sm text-text-secondary">{job.company}</p>
                          <p className="text-sm text-text-muted mt-0.5">Posted: {formatDate(job.postedAt)}</p>
                          <p className="text-sm font-medium text-text-primary mt-1">
                            {job.applicationCount ?? 0} application{(job.applicationCount ?? 0) !== 1 ? 's' : ''}
                            {job.applicationStats && (
                              <span className="text-text-muted font-normal block mt-0.5">
                                {APP_STAT_KEYS.map((key) => `${APP_STAT_SHORT[key]}: ${job.applicationStats[key] ?? 0}`).join(' · ')}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="shrink-0 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="mt-3 pl-2 border-l-2 border-primary/30 rounded-r-lg space-y-2">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Applicants</p>
                        {apps.length === 0 ? (
                          <p className="text-sm text-text-muted">No applications yet.</p>
                        ) : (
                          apps.map((app) => (
                            <div
                              key={app.id}
                              className="flex flex-wrap items-center gap-3 py-2.5 px-3 rounded-xl bg-surface-soft border border-white/5"
                            >
                              <Avatar name={app.applicant?.name} email={app.applicant?.email} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-text-primary">{app.applicant?.name || app.applicant?.email || '—'}</p>
                                {app.applicant?.email && app.applicant?.name && (
                                  <p className="text-xs text-text-muted truncate">{app.applicant.email}</p>
                                )}
                                <p className="text-xs text-text-muted mt-0.5">Applied: {formatDate(app.appliedAt)}</p>
                              </div>
                              <ApplicationStatusBadge status={app.status} />
                              {app.applicant?.cvSlug && (
                                <a
                                  href={`${CLIENT_BASE.replace(/\/+$/, '')}/${app.applicant.cvSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-lg border border-white/10 bg-input text-text-primary text-sm font-medium hover:bg-hover hover:border-accent/30 transition-ui shrink-0"
                                >
                                  <User className="w-3.5 h-3.5" />
                                  View profile
                                </a>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {job.employer?.cvSlug && (
                        <a
                          href={`${CLIENT_BASE.replace(/\/+$/, '')}/${job.employer.cvSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-xl border border-white/10 bg-input text-text-primary text-sm font-medium hover:bg-hover hover:border-accent/30 transition-ui"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View profile
                        </a>
                      )}
                      <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteModal({ id: job.id, title: job.title })}
                      disabled={actionLoading === job.id}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete job
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted mb-4">
                  <Briefcase className="w-8 h-8" />
                </div>
                <p className="text-text-primary font-medium">No jobs found</p>
                <p className="text-sm text-text-secondary mt-1">Try adjusting your search</p>
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
            onItemsPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            totalItems={pagination.totalItems}
          />
        )}
      </Card>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete job">
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-text-secondary">
              Are you sure you want to delete <strong className="text-text-primary">{deleteModal.title}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={actionLoading === deleteModal.id}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
