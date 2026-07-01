import { useCallback, useEffect, useState } from 'react';
import { fetchTeam, fetchTeamStats } from '@/services/teamClient';
import type { TeamMember, TeamRole, TeamStats } from '@/types/teamMember';

const blank: TeamStats = { total: 0, active: 0, inactive: 0, owners: 0, managers: 0, staff: 0, assigned: 0 };

export function useTeamDirectory() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>(blank);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<TeamRole | ''>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | ''>('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([
        fetchTeam({ search: search || undefined, role: role || undefined, status: status || undefined, limit: 100 }),
        fetchTeamStats(),
      ]);
      setMembers(list.employees || []);
      setStats(summary.data || blank);
    } finally {
      setLoading(false);
    }
  }, [search, role, status]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { members, stats, loading, search, setSearch, role, setRole, status, setStatus, refresh };
}
