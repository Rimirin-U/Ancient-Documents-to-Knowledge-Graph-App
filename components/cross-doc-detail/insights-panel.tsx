import { ThemedText } from '@/components/themed-text';
import { View, StyleSheet } from 'react-native';

// ── 类型定义 ─────────────────────────────────────────────────

export type CrossDocStatistics = {
  doc_count?: number;
  time_range?: {
    start?: number;
    end?: number;
    span?: number;
    docs_with_time?: number;
  };
  unique_people?: number;
  cross_role_people?: string[];
  top_people?: Array<{
    name: string;
    doc_count: number;
    roles: string[];
  }>;
  top_locations?: Array<{
    name: string;
    count: number;
  }>;
  land_chains?: Array<{
    location: string;
    transaction_count: number;
    years?: number[];
  }>;
  land_chain_count?: number;
};

type CrossDocInsightsPanelProps = {
  statistics?: CrossDocStatistics;
  insights?: string;
};

// ── 角色中文映射 ──────────────────────────────────────────────

const ROLE_ZH: Record<string, string> = {
  Seller: '卖方',
  Buyer: '买方',
  Middleman: '中人',
};

// ── 统计卡片 ──────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

// ── 主组件 ───────────────────────────────────────────────────

export function CrossDocInsightsPanel({ statistics, insights }: CrossDocInsightsPanelProps) {
  if (!statistics && !insights) return null;

  const {
    doc_count,
    time_range,
    unique_people,
    cross_role_people,
    top_people,
    top_locations,
    land_chains,
    land_chain_count,
  } = statistics ?? {};

  const hasStats = doc_count !== undefined || unique_people !== undefined;
  if (!hasStats && !insights) return null;

  const crossCount = cross_role_people?.length ?? 0;
  const chainCount = land_chain_count ?? land_chains?.length ?? 0;

  return (
    <View style={styles.container}>
      {/* 核心数字统计行 */}
      {hasStats && (
        <View style={styles.statsRow}>
          {doc_count !== undefined && (
            <StatCard label="文书总数" value={`${doc_count} 份`} color="#2563eb" />
          )}
          {unique_people !== undefined && (
            <StatCard label="涉及人物" value={`${unique_people} 人`} color="#059669" />
          )}
          {(time_range?.span ?? 0) > 0 && (
            <StatCard label="时间跨度" value={`${time_range!.span} 年`} color="#d97706" />
          )}
          {crossCount > 0 && (
            <StatCard label="角色切换" value={`${crossCount} 人`} color="#7c3aed" />
          )}
          {chainCount > 0 && (
            <StatCard label="地块流转" value={`${chainCount} 处`} color="#b45309" />
          )}
        </View>
      )}

      {/* 时间范围 */}
      {time_range?.start && time_range?.end && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>时间跨度</ThemedText>
          <ThemedText style={styles.timeRange}>
            公元 {time_range.start} 年 — {time_range.end} 年
            {(time_range.span ?? 0) > 0 ? `（历时约 ${time_range.span} 年）` : ''}
          </ThemedText>
        </View>
      )}

      {/* 角色切换人物 */}
      {crossCount > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>角色切换人物</ThemedText>
          <View style={styles.chipRow}>
            {cross_role_people!.map((name, i) => (
              <View key={i} style={styles.chipPurple}>
                <ThemedText style={styles.chipTextPurple}>{name}</ThemedText>
              </View>
            ))}
          </View>
          <ThemedText style={styles.hintText}>
            这些人物曾在不同文书中身兼多职（如既作卖方又作买方），是地方社会网络中的关键节点。
          </ThemedText>
        </View>
      )}

      {/* 核心人物 */}
      {(top_people?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>核心人物</ThemedText>
          {top_people!.map((person, i) => (
            <View key={i} style={styles.personRow}>
              <View style={styles.personRank}>
                <ThemedText style={styles.rankText}>{i + 1}</ThemedText>
              </View>
              <ThemedText style={styles.personName}>{person.name}</ThemedText>
              <ThemedText style={styles.personDetail}>
                {person.roles.map((r) => ROLE_ZH[r] ?? r).join('/')} · {person.doc_count} 份
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* 主要交易地点 */}
      {(top_locations?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>主要交易地点</ThemedText>
          {top_locations!.map((loc, i) => (
            <View key={i} style={styles.locationRow}>
              <View style={[styles.locationBar, { width: `${Math.min(100, (loc.count / top_locations![0].count) * 100)}%` as any }]} />
              <ThemedText style={styles.locationName} numberOfLines={1}>
                {loc.name}
              </ThemedText>
              <ThemedText style={styles.locationCount}>× {loc.count}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* 地产流转记录 */}
      {(land_chains?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>地产多次易手</ThemedText>
          {land_chains!.slice(0, 3).map((chain, i) => (
            <View key={i} style={styles.chainRow}>
              <View style={styles.chainDot} />
              <View style={styles.chainContent}>
                <ThemedText style={styles.chainLocation} numberOfLines={1}>
                  {chain.location}
                </ThemedText>
                <ThemedText style={styles.chainDetail}>
                  共 {chain.transaction_count} 次交易
                  {chain.years && chain.years.length >= 2
                    ? `  ·  ${chain.years[0]}—${chain.years[chain.years.length - 1]} 年`
                    : ''}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* AI 历史洞察 */}
      {insights && (
        <View style={[styles.section, styles.insightsSection]}>
          <View style={styles.insightsTitleRow}>
            <View style={styles.aiBadge}>
              <ThemedText style={styles.aiBadgeText}>AI</ThemedText>
            </View>
            <ThemedText style={styles.sectionTitle}>历史洞察</ThemedText>
          </View>
          <ThemedText style={styles.insightsText}>{insights}</ThemedText>
        </View>
      )}
    </View>
  );
}

// ── 样式 ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 68,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.65,
    marginTop: 2,
  },
  section: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'rgba(37,99,235,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.12)',
    gap: 6,
  },
  insightsSection: {
    backgroundColor: 'rgba(124,58,237,0.04)',
    borderColor: 'rgba(124,58,237,0.15)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
  },
  timeRange: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d97706',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipPurple: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipTextPurple: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 13,
  },
  hintText: {
    fontSize: 11,
    opacity: 0.55,
    lineHeight: 17,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  personRank: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(37,99,235,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  personName: {
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  personDetail: {
    fontSize: 12,
    opacity: 0.6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
    position: 'relative',
  },
  locationBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(217,119,6,0.12)',
    borderRadius: 4,
  },
  locationName: {
    flex: 1,
    fontSize: 13,
    zIndex: 1,
  },
  locationCount: {
    fontWeight: '700',
    fontSize: 13,
    color: '#d97706',
    zIndex: 1,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  chainDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#b45309',
    marginTop: 5,
  },
  chainContent: {
    flex: 1,
    gap: 2,
  },
  chainLocation: {
    fontSize: 13,
    fontWeight: '600',
  },
  chainDetail: {
    fontSize: 11,
    opacity: 0.6,
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadge: {
    backgroundColor: '#7c3aed',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  insightsText: {
    fontSize: 13,
    lineHeight: 22,
    opacity: 0.88,
  },
});
