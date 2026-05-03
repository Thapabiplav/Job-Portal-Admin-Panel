import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers,
  updateUserRole,
  deleteUser,
  selectUsersList,
  selectUsersPagination,
  selectUsersLoading,
  selectUsersActionLoading,
  selectUsersActionError,
  clearUsersError,
} from '../../features/users/usersSlice';
import { selectStats } from '../../features/stats/statsSlice';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/modals/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/cards/StatCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { Lock, FileText, Trash2, Users, UserCircle, Building2, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { MobileDetailEyeButton } from '../../components/mobile/MobileDetailEyeButton';

const CLIENT_BASE = import.meta.env.VITE_CLIENT_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const statIconSize = 'w-5 h-5';

export default function UsersPage() {
  const dispatch = useDispatch();
  const list = useSelector(selectUsersList);
  const pagination = useSelector(selectUsersPagination);
  const loading = useSelector(selectUsersLoading);
  const actionLoading = useSelector(selectUsersActionLoading);
  const actionError = useSelector(selectUsersActionError);
  const stats = useSelector(selectStats);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [roleModal, setRoleModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const actionErrorRef = useRef(actionError);
  useEffect(() => {
    actionErrorRef.current = actionError;
  }, [actionError]);

  const load = useCallback(() => {
    dispatch(
      fetchUsers({
        page,
        limit: perPage,
        ...(roleFilter && { role: roleFilter }),
        ...(appliedSearch.trim() && { search: appliedSearch.trim() }),
      })
    );
  }, [dispatch, page, perPage, roleFilter, appliedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setExpandedUserId(null);
  }, [page, appliedSearch, roleFilter]);

  useEffect(() => {
    if (actionErrorRef.current) dispatch(clearUsersError());
  }, [dispatch, roleModal, deleteModal]);

  const handleRoleSubmit = async () => {
    if (!roleModal?.id || !roleModal?.newRole) return;
    const roleResult = await dispatch(updateUserRole({ id: roleModal.id, role: roleModal.newRole }));
    if (updateUserRole.fulfilled.match(roleResult)) {
      toast.success('User role updated successfully');
      setRoleModal(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal?.id) return;
    const deleteResult = await dispatch(deleteUser(deleteModal.id));
    if (deleteUser.fulfilled.match(deleteResult)) {
      toast.success('User deleted successfully');
      setDeleteModal(null);
    }
  };

  const cvUrl = (user) => {
    if (!user?.cvSlug) return null;
    const base = CLIENT_BASE.replace(/\/+$/, '');
    return `${base}/${user.cvSlug}`;
  };

  const totalPages = pagination.totalPages || 1;
  const isSuperAdmin = (u) => u.role === 'superadmin';

  const userStats = stats?.users || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">Users</h1>
        <p className="text-text-primary text-sm mt-1">Manage accounts and roles — candidates, employers, and admins</p>
      </div>

      <section className="grid grid-cols-3 gap-2 md:gap-4">
        <StatCard
          compact
          title={
            <>
              <span className="md:hidden">Users</span>
              <span className="hidden md:inline">Total Users</span>
            </>
          }
          value={userStats.total ?? 0}
          icon={<Users className={statIconSize} />}
        />
        <StatCard
          compact
          title={
            <>
              <span className="md:hidden">Candidates</span>
              <span className="hidden md:inline">Total Candidates</span>
            </>
          }
          value={userStats.candidates ?? 0}
          icon={<UserCircle className={statIconSize} />}
        />
        <StatCard
          compact
          title={
            <>
              <span className="md:hidden">Employers</span>
              <span className="hidden md:inline">Total Employers</span>
            </>
          }
          value={userStats.employers ?? 0}
          icon={<Building2 className={statIconSize} />}
        />
      </section>

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
                placeholder="Name or email..."
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
                className="w-full min-h-[44px] rounded-2xl border border-white/10 bg-input py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted shadow-inner shadow-black/25 outline-none transition-ui focus:border-accent/35 focus:ring-[3px] focus:ring-accent/20 sm:rounded-xl"
              />
            </div>
            <div className="flex min-h-[44px] gap-2 sm:contents">
              <div className="relative min-w-0 flex-1 sm:w-44 sm:shrink-0">
                <select
                  value={roleFilter}
                  aria-label="Filter by role"
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-full min-h-[44px] w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-input py-2.5 pl-3.5 pr-10 text-sm text-text-primary shadow-inner shadow-black/25 outline-none transition-ui focus:border-accent/35 focus:ring-[3px] focus:ring-accent/20 sm:rounded-xl sm:pl-4"
                >
                  <option value="">All roles</option>
                  <option value="candidate">Candidate</option>
                  <option value="employer">Employer</option>
                  <option value="superadmin">Super Admin</option>
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

      {actionError && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-sm">
          {actionError}
        </div>
      )}

      <Card padding={false}>
        {loading && !list.length ? (
          <div className="p-4 sm:p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl overflow-hidden">
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="bg-input border-b border-accent">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent rounded-tl-xl border-r border-accent/40">User</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent border-r border-accent/40">Email</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent border-r border-accent/40">Role</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-accent rounded-tr-xl border-r-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className="border-b border-accent/40 text-text-primary transition-shadow admin-table-row-hover hover:bg-hover/30">
                      <td className="py-3 px-4 border-r border-accent/40">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} email={u.email} size="md" />
                          <span className="font-medium text-[#FFFFFF]">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#FFFFFF] border-r border-accent/40">{u.email}</td>
                      <td className="py-3 px-4 border-r border-accent/40">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="py-3 px-4 border-r-0">
                        <div className="flex flex-wrap gap-x-4 gap-y-3">
                          {!isSuperAdmin(u) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setRoleModal({ id: u.id, name: u.name, currentRole: u.role, newRole: u.role })}
                              disabled={actionLoading === 'role'}
                            >
                              Change role
                            </Button>
                          )}
                          {isSuperAdmin(u) && (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted" title="Editing disabled for Super Admin">
                              <Lock className="w-4 h-4" />
                              Locked
                            </span>
                          )}
                          {u.cvSlug && (
                            <a
                              href={cvUrl(u)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-hover text-text-primary hover:bg-white/10 transition-ui"
                            >
                              <FileText className="w-4 h-4" />
                              View CV
                            </a>
                          )}
                          {!isSuperAdmin(u) && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setDeleteModal({ id: u.id, name: u.name })}
                              disabled={actionLoading === u.id}
                              className="inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" aria-hidden />
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-white/5">
              {list.map((u) => {
                const expanded = expandedUserId === u.id;
                return (
                  <div key={u.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={u.name} email={u.email} size="lg" />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="font-semibold text-text-primary">{u.name}</p>
                        <div className="mt-1.5">
                          <RoleBadge role={u.role} />
                        </div>
                      </div>
                      <MobileDetailEyeButton
                        expanded={expanded}
                        onClick={() =>
                          setExpandedUserId((id) => (id === u.id ? null : u.id))
                        }
                        aria-label={expanded ? 'Hide email and actions' : 'Show email and actions'}
                      />
                    </div>
                    {expanded && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 space-y-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Email:
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate text-sm text-text-primary"
                            title={u.email}
                          >
                            {u.email}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-white/10">
                          {isSuperAdmin(u) ? (
                            <div className="flex justify-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-text-muted bg-white/5 min-h-[44px]">
                                <Lock className="w-4 h-4 shrink-0" aria-hidden />
                                Locked
                              </span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-x-2 gap-y-2 items-center">
                              <div className="flex justify-start min-w-0">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    setRoleModal({
                                      id: u.id,
                                      name: u.name,
                                      currentRole: u.role,
                                      newRole: u.role,
                                    })
                                  }
                                  disabled={actionLoading === 'role'}
                                  className="min-h-[44px] max-w-full px-2.5 text-xs font-semibold sm:text-sm sm:px-3"
                                >
                                  <span className="truncate">Change role</span>
                                </Button>
                              </div>
                              <div className="flex justify-center min-w-0">
                                {u.cvSlug ? (
                                  <a
                                    href={cvUrl(u)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex max-w-full items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold sm:text-sm bg-hover text-text-primary min-h-[44px] hover:bg-white/10 transition-ui"
                                  >
                                    <FileText className="w-4 h-4 shrink-0" aria-hidden />
                                    <span className="truncate">View CV</span>
                                  </a>
                                ) : (
                                  <span className="inline-flex min-h-[44px] max-w-full items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] px-2 text-[11px] font-medium text-text-muted">
                                    No CV
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-end min-w-0">
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => setDeleteModal({ id: u.id, name: u.name })}
                                  disabled={actionLoading === u.id}
                                  className="min-h-[44px] max-w-full px-2.5 text-xs font-semibold sm:text-sm sm:px-3 inline-flex items-center justify-center gap-1.5"
                                >
                                  <Trash2 className="w-4 h-4 shrink-0" aria-hidden />
                                  <span className="truncate">Delete</span>
                                </Button>
                              </div>
                            </div>
                          )}
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
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-text-primary font-medium">No users found</p>
                <p className="text-sm text-text-secondary mt-1">Try a different search or filter</p>
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

      <Modal
        open={!!roleModal}
        onClose={() => setRoleModal(null)}
        title="Change role"
      >
        {roleModal && (
          <div className="space-y-4">
            <p className="text-text-secondary">User: <strong className="text-text-primary">{roleModal.name}</strong></p>
            <p className="text-sm text-text-muted">New role (candidate or employer only):</p>
            <select
              value={roleModal.newRole}
              onChange={(e) => setRoleModal((m) => ({ ...m, newRole: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-input border border-white/10 text-text-primary focus:ring-2 focus:ring-accent transition-ui"
            >
              <option value="candidate">Candidate</option>
              <option value="employer">Employer</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setRoleModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleRoleSubmit} disabled={roleModal.newRole === roleModal.currentRole || actionLoading === 'role'}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete user">
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-text-secondary">
              Are you sure you want to delete <strong className="text-text-primary">{deleteModal.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={actionLoading === deleteModal.id}>
                Yes
              </Button>
              <Button variant="secondary" onClick={() => setDeleteModal(null)}>No</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
