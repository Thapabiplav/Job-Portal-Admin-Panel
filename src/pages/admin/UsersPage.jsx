import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers,
  updateUserRole,
  deleteUser,
  selectUsersList,
  selectUsersPagination,
  selectUsersLoading,
  selectUsersError,
  selectUsersActionLoading,
  selectUsersActionError,
  clearUsersError,
} from '../../features/users/usersSlice';
import { fetchStats } from '../../features/stats/statsSlice';
import { selectStats } from '../../features/stats/statsSlice';
import toast from 'react-hot-toast';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/modals/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/cards/StatCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { Lock, FileText, Trash2, Users, UserCircle, Building2 } from 'lucide-react';

const CLIENT_BASE = import.meta.env.VITE_CLIENT_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const statIconSize = 'w-5 h-5';

export default function UsersPage() {
  const dispatch = useDispatch();
  const list = useSelector(selectUsersList);
  const pagination = useSelector(selectUsersPagination);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const actionLoading = useSelector(selectUsersActionLoading);
  const actionError = useSelector(selectUsersActionError);
  const stats = useSelector(selectStats);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [roleModal, setRoleModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const load = useCallback(() => {
    dispatch(
      fetchUsers({
        page,
        limit: perPage,
        ...(roleFilter && { role: roleFilter }),
        ...(search.trim() && { search: search.trim() }),
      })
    );
  }, [dispatch, page, perPage, roleFilter, search]);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (actionError) dispatch(clearUsersError());
  }, [roleModal, deleteModal]);

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

      <section className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="Total Users" value={userStats.total ?? 0} icon={<Users className={statIconSize} />} />
        <StatCard title="Total Candidates" value={userStats.candidates ?? 0} icon={<UserCircle className={statIconSize} />} />
        <StatCard title="Total Employers" value={userStats.employers ?? 0} icon={<Building2 className={statIconSize} />} />
      </section>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPage(1) && load()}
            className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-input border border-white/10 text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-ui"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl border border-white/10 bg-input text-text-primary min-h-[44px] focus:ring-2 focus:ring-accent transition-ui"
          >
            <option value="">All roles</option>
            <option value="candidate">Candidate</option>
            <option value="employer">Employer</option>
            <option value="superadmin">Super Admin</option>
          </select>
          <Button
            variant="primary"
            onClick={() => {
              setPage(1);
              dispatch(
                fetchUsers({
                  page: 1,
                  limit: perPage,
                  ...(roleFilter && { role: roleFilter }),
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
                        <div className="flex flex-wrap gap-2">
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
                            >
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
              {list.map((u) => (
                <div key={u.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} email={u.email} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary">{u.name}</p>
                      <p className="text-sm text-text-secondary truncate">{u.email}</p>
                      <div className="mt-1.5">
                        <RoleBadge role={u.role} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {!isSuperAdmin(u) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setRoleModal({ id: u.id, name: u.name, currentRole: u.role, newRole: u.role })}
                        disabled={actionLoading === 'role'}
                        className="min-h-[44px]"
                      >
                        Change role
                      </Button>
                    )}
                    {isSuperAdmin(u) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-text-muted bg-white/5 min-h-[44px]">
                        <Lock className="w-4 h-4" />
                        Locked
                      </span>
                    )}
                    {u.cvSlug && (
                      <a
                        href={cvUrl(u)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-hover text-text-primary min-h-[44px]"
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
                        className="min-h-[44px]"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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
