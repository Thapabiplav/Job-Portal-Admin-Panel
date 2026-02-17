import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, FileText, Building2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStats } from '../../features/stats/statsSlice';
import { selectStats, selectStatsLoading, selectStatsError } from '../../features/stats/statsSlice';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/cards/StatCard';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

const iconSize = "w-5 h-5";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const stats = useSelector(selectStats);
  const loading = useSelector(selectStatsLoading);
  const error = useSelector(selectStatsError);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-4 w-64 mt-2 bg-white/10" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 sm:h-28 rounded-xl sm:rounded-2xl bg-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-2xl bg-white/10" />
          <Skeleton className="h-48 rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-6">
        <p>{error}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => dispatch(fetchStats())}>
          Retry
        </Button>
      </div>
    );
  }

  const s = stats || {};
  const users = s.users || {};
  const jobs = s.jobs || {};
  const applications = s.applications || {};
  const organizations = s.organizations || {};
  const byType = jobs.byType || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-accent tracking-tight">Dashboard</h1>
        <p className="text-text-primary text-sm mt-1">Overview of your portal</p>
      </div>

      <section className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          title="Total Users"
          value={users.total ?? 0}
          subtitle={users.newLast30Days ? `+${users.newLast30Days} last 30 days` : null}
          icon={<Users className={iconSize} />}
        />
        <StatCard
          title="Total Jobs"
          value={jobs.total ?? 0}
          subtitle={jobs.newLast30Days ? `+${jobs.newLast30Days} last 30 days` : null}
          icon={<Briefcase className={iconSize} />}
        />
        <StatCard
          title="Applications"
          value={applications.total ?? 0}
          subtitle={applications.newLast30Days ? `+${applications.newLast30Days} last 30 days` : null}
          icon={<FileText className={iconSize} />}
        />
        <StatCard
          title="Pending Companies"
          value={organizations.pendingVerification ?? 0}
          subtitle={organizations.verified != null ? `${organizations.verified} verified` : null}
          icon={<Building2 className={iconSize} />}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Application statistics" subtitle="By status" />
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-text-secondary">Pending</span>
              <span className="font-semibold text-text-primary">{applications.pending ?? 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400">Accepted</span>
              <span className="font-semibold text-emerald-400">{applications.accepted ?? 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-red-400">Rejected</span>
              <span className="font-semibold text-red-400">{applications.rejected ?? 0}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Jobs by type" subtitle="Distribution" />
          <div className="mt-4 space-y-2">
            {byType.length === 0 && (
              <p className="text-text-muted text-sm py-4">No job types yet.</p>
            )}
            {byType.map((item) => (
              <div key={item.type || 'unknown'} className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                <span className="text-text-secondary capitalize">{item.type || 'Other'}</span>
                <span className="font-semibold text-text-primary">{item.count ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader title="Quick actions" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/users">
            <Button variant="primary">Manage Users</Button>
          </Link>
          <Link to="/admin/jobs">
            <Button variant="secondary">Moderate Jobs</Button>
          </Link>
          <Link to="/admin/companies">
            <Button variant="secondary">Approve Companies</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
