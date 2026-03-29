import { ThemedText } from '@/components/themed-text';
import { View, StyleSheet } from 'react-native';
import type { CrossDocStatistics } from '@/services/cross-doc';

export type { CrossDocStatistics };

type CrossDocInsightsPanelProps = {
  statistics?: CrossDocStatistics;
  insights?: string;
};

const ROLE_ZH: Record<string, string> = {
  Seller: '卖方',
  Buyer: '买方',
  Middleman: '中人',
};

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function SectionBadge({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.sectionBadge, { backgroundColor: color }]}>
      <ThemedText style={styles.sectionBadgeText}>{text}</ThemedText>
    </View>
  );
}

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
    clan_groups,
    witness_network,
    decade_distribution,
    price_trend,
    avg_price,
    total_transaction_value,
    network_metrics,
  } = statistics ?? {};

  const hasStats = doc_count !== undefined || unique_people !== undefined;
  if (!hasStats && !insights) return null;

  const crossCount = cross_role_people?.length ?? 0;
  const chainCount = land_chain_count ?? land_chains?.length ?? 0;

  return (
    <View style={styles.container}>
      {/* ── 核心数字统计行 ── */}
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
          {avg_price != null && (
            <StatCard label="均价" value={`${avg_price} 两`} color="#0891b2" />
          )}
        </View>
      )}

      {/* ── 时间分布（年代柱状图替代） ── */}
      {(decade_distribution?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="时" color="#d97706" />
            <ThemedText style={styles.sectionTitle}>时代分布</ThemedText>
          </View>
          {time_range?.start != null && time_range?.end != null && (
            <ThemedText style={styles.timeRange}>
              公元 {time_range.start} 年 — {time_range.end} 年
              {(time_range.span ?? 0) > 0 ? `（历时约 ${time_range.span} 年）` : ''}
            </ThemedText>
          )}
          <View style={styles.barChartWrap}>
            {decade_distribution!.map((d, i) => {
              const maxCount = Math.max(...decade_distribution!.map((dd) => dd.count));
              const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              return (
                <View key={i} style={styles.barItem}>
                  <ThemedText style={styles.barCount}>{d.count}</ThemedText>
                  <View style={[styles.bar, { height: Math.max(4, pct * 0.6), backgroundColor: '#d97706' }]} />
                  <ThemedText style={styles.barLabel}>{d.decade}</ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── 角色切换人物 ── */}
      {crossCount > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="变" color="#7c3aed" />
            <ThemedText style={styles.sectionTitle}>角色切换人物</ThemedText>
          </View>
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

      {/* ── 核心人物 ── */}
      {(top_people?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="人" color="#2563eb" />
            <ThemedText style={styles.sectionTitle}>核心人物</ThemedText>
          </View>
          {top_people!.map((person, i) => (
            <View key={i} style={styles.personRow}>
              <View style={[styles.personRank, i === 0 && styles.personRankFirst]}>
                <ThemedText style={[styles.rankText, i === 0 && styles.rankTextFirst]}>{i + 1}</ThemedText>
              </View>
              <ThemedText style={styles.personName}>{person.name}</ThemedText>
              <ThemedText style={styles.personDetail}>
                {person.roles.map((r) => ROLE_ZH[r] ?? r).join('/')} · {person.doc_count} 份
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* ── 宗族/家族聚集 ── */}
      {(clan_groups?.length ?? 0) > 0 && (
        <View style={[styles.section, styles.clanSection]}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="族" color="#be185d" />
            <ThemedText style={styles.sectionTitle}>宗族聚集</ThemedText>
          </View>
          {clan_groups!.map((clan, i) => (
            <View key={i} style={styles.clanRow}>
              <View style={styles.clanBadge}>
                <ThemedText style={styles.clanSurname}>{clan.surname}</ThemedText>
              </View>
              <View style={styles.clanContent}>
                <ThemedText style={styles.clanMembers} numberOfLines={2}>
                  {clan.members.join('、')}
                </ThemedText>
                <ThemedText style={styles.clanCount}>{clan.count} 人参与交易</ThemedText>
              </View>
            </View>
          ))}
          <ThemedText style={styles.hintText}>
            同姓人物聚集可能反映宗族土地经营、族内产权流转等社会关系。
          </ThemedText>
        </View>
      )}

      {/* ── 见证人网络 ── */}
      {(witness_network?.length ?? 0) > 0 && (
        <View style={[styles.section, styles.witnessSection]}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="证" color="#059669" />
            <ThemedText style={styles.sectionTitle}>见证人网络</ThemedText>
          </View>
          {witness_network!.slice(0, 4).map((w, i) => (
            <View key={i} style={styles.witnessRow}>
              <View style={styles.witnessBadge}>
                <ThemedText style={styles.witnessBadgeText}>{w.witness_count}次</ThemedText>
              </View>
              <View style={styles.witnessContent}>
                <ThemedText style={styles.witnessName}>{w.name}</ThemedText>
                {w.witnessed_parties.length > 0 && (
                  <ThemedText style={styles.witnessParties} numberOfLines={1}>
                    见证对象：{w.witnessed_parties.slice(0, 4).join('、')}
                    {w.witnessed_parties.length > 4 ? ' 等' : ''}
                  </ThemedText>
                )}
              </View>
            </View>
          ))}
          <ThemedText style={styles.hintText}>
            活跃见证人是地方信用网络的核心，反映其社会地位和公信力。
          </ThemedText>
        </View>
      )}

      {/* ── 经济分析 ── */}
      {(price_trend?.length ?? 0) > 0 && (
        <View style={[styles.section, styles.priceSection]}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="银" color="#0891b2" />
            <ThemedText style={styles.sectionTitle}>经济分析</ThemedText>
          </View>
          <View style={styles.priceStatsRow}>
            {avg_price != null && (
              <View style={styles.priceStat}>
                <ThemedText style={styles.priceStatValue}>{avg_price} 两</ThemedText>
                <ThemedText style={styles.priceStatLabel}>平均价格</ThemedText>
              </View>
            )}
            {total_transaction_value != null && (
              <View style={styles.priceStat}>
                <ThemedText style={styles.priceStatValue}>{total_transaction_value} 两</ThemedText>
                <ThemedText style={styles.priceStatLabel}>交易总额</ThemedText>
              </View>
            )}
            <View style={styles.priceStat}>
              <ThemedText style={styles.priceStatValue}>{price_trend!.length} 笔</ThemedText>
              <ThemedText style={styles.priceStatLabel}>可识别交易</ThemedText>
            </View>
          </View>
          {price_trend!.filter((p) => p.year).length >= 2 && (
            <View style={styles.priceTrendWrap}>
              <ThemedText style={styles.priceTrendTitle}>价格变动</ThemedText>
              {price_trend!
                .filter((p) => p.year)
                .slice(0, 8)
                .map((p, i) => (
                  <View key={i} style={styles.priceTrendRow}>
                    <ThemedText style={styles.priceTrendYear}>{p.year}年</ThemedText>
                    <View style={styles.priceTrendBarWrap}>
                      <View
                        style={[
                          styles.priceTrendBar,
                          {
                            width: `${Math.min(100, (p.price / Math.max(...price_trend!.map((pp) => pp.price))) * 100)}%` as any,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.priceTrendValue}>{p.raw}</ThemedText>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {/* ── 社会网络结构 ── */}
      {network_metrics && (
        <View style={[styles.section, styles.networkSection]}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="网" color="#6366f1" />
            <ThemedText style={styles.sectionTitle}>社会网络结构</ThemedText>
          </View>
          <View style={styles.networkStatsRow}>
            {network_metrics.density != null && (
              <View style={styles.networkStat}>
                <ThemedText style={styles.networkStatValue}>{network_metrics.density.toFixed(3)}</ThemedText>
                <ThemedText style={styles.networkStatLabel}>网络密度</ThemedText>
              </View>
            )}
            {network_metrics.avg_degree != null && (
              <View style={styles.networkStat}>
                <ThemedText style={styles.networkStatValue}>{network_metrics.avg_degree}</ThemedText>
                <ThemedText style={styles.networkStatLabel}>平均度数</ThemedText>
              </View>
            )}
            {network_metrics.components != null && (
              <View style={styles.networkStat}>
                <ThemedText style={styles.networkStatValue}>{network_metrics.components}</ThemedText>
                <ThemedText style={styles.networkStatLabel}>连通分量</ThemedText>
              </View>
            )}
          </View>
          {(network_metrics.bridge_people?.length ?? 0) > 0 && (
            <View style={styles.bridgeWrap}>
              <ThemedText style={styles.bridgeTitle}>关键桥接人物</ThemedText>
              <View style={styles.chipRow}>
                {network_metrics.bridge_people!.map((b, i) => (
                  <View key={i} style={styles.chipIndigo}>
                    <ThemedText style={styles.chipTextIndigo}>{b.name}</ThemedText>
                  </View>
                ))}
              </View>
              <ThemedText style={styles.hintText}>
                桥接人物连接不同社交圈层，在交易网络中起到信息传递和信任中介作用。
              </ThemedText>
            </View>
          )}
          {(network_metrics.communities?.length ?? 0) > 1 && (
            <View style={styles.communityWrap}>
              <ThemedText style={styles.bridgeTitle}>社区结构（{network_metrics.communities!.length} 个社区）</ThemedText>
              {network_metrics.communities!.slice(0, 3).map((comm, i) => (
                <View key={i} style={styles.communityRow}>
                  <View style={[styles.communityDot, { backgroundColor: ['#2563eb', '#059669', '#d97706'][i % 3] }]} />
                  <ThemedText style={styles.communityText} numberOfLines={1}>
                    {comm.members.slice(0, 5).join('、')}{comm.members.length > 5 ? ` 等${comm.size}人` : ''}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── 主要交易地点 ── */}
      {(top_locations?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="地" color="#d97706" />
            <ThemedText style={styles.sectionTitle}>主要交易地点</ThemedText>
          </View>
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

      {/* ── 地产流转记录（增强版含流转链） ── */}
      {(land_chains?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <SectionBadge text="转" color="#b45309" />
            <ThemedText style={styles.sectionTitle}>地产流转链</ThemedText>
          </View>
          {land_chains!.slice(0, 4).map((chain, i) => (
            <View key={i} style={styles.chainBlock}>
              <View style={styles.chainHeader}>
                <View style={styles.chainDot} />
                <ThemedText style={styles.chainLocation} numberOfLines={1}>
                  {chain.location}
                </ThemedText>
                <ThemedText style={styles.chainDetail}>
                  {chain.transaction_count} 次交易
                  {chain.years && chain.years.length >= 2
                    ? ` · ${chain.years[0]}—${chain.years[chain.years.length - 1]}年`
                    : ''}
                </ThemedText>
              </View>
              {(chain.transfers?.length ?? 0) > 0 && (
                <View style={styles.transferChain}>
                  {chain.transfers!.slice(0, 5).map((t, j) => (
                    <View key={j} style={styles.transferRow}>
                      <View style={styles.transferLine}>
                        <View style={styles.transferDotSmall} />
                        {j < (chain.transfers?.length ?? 1) - 1 && j < 4 && (
                          <View style={styles.transferConnector} />
                        )}
                      </View>
                      <View style={styles.transferContent}>
                        <ThemedText style={styles.transferText}>
                          {t.from ?? '?'} → {t.to ?? '?'}
                          {t.time ? ` (${t.time})` : ''}
                        </ThemedText>
                        {t.price && <ThemedText style={styles.transferPrice}>{t.price}</ThemedText>}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ── AI 历史洞察 ── */}
      {insights && (
        <View style={[styles.section, styles.insightsSection]}>
          <View style={styles.insightsTitleRow}>
            <View style={styles.aiBadge}>
              <ThemedText style={styles.aiBadgeText}>AI</ThemedText>
            </View>
            <ThemedText style={styles.sectionTitle}>深度历史洞察</ThemedText>
          </View>
          <ThemedText style={styles.insightsText}>{insights}</ThemedText>
        </View>
      )}
    </View>
  );
}

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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionBadge: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  insightsSection: {
    backgroundColor: 'rgba(124,58,237,0.04)',
    borderColor: 'rgba(124,58,237,0.15)',
  },
  clanSection: {
    backgroundColor: 'rgba(190,24,93,0.04)',
    borderColor: 'rgba(190,24,93,0.12)',
  },
  witnessSection: {
    backgroundColor: 'rgba(5,150,105,0.04)',
    borderColor: 'rgba(5,150,105,0.12)',
  },
  priceSection: {
    backgroundColor: 'rgba(8,145,178,0.04)',
    borderColor: 'rgba(8,145,178,0.12)',
  },
  networkSection: {
    backgroundColor: 'rgba(99,102,241,0.04)',
    borderColor: 'rgba(99,102,241,0.12)',
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
  // ── 年代柱状图 ──
  barChartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    width: '80%',
    borderRadius: 3,
    minHeight: 4,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
  },
  barLabel: {
    fontSize: 9,
    opacity: 0.55,
  },
  // ── chips ──
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
  chipIndigo: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipTextIndigo: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 13,
  },
  hintText: {
    fontSize: 11,
    opacity: 0.55,
    lineHeight: 17,
  },
  // ── 人物 ──
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
  personRankFirst: {
    backgroundColor: '#2563eb',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  rankTextFirst: {
    color: '#fff',
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
  // ── 宗族 ──
  clanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  clanBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(190,24,93,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clanSurname: {
    fontSize: 15,
    fontWeight: '800',
    color: '#be185d',
  },
  clanContent: {
    flex: 1,
    gap: 2,
  },
  clanMembers: {
    fontSize: 13,
    lineHeight: 18,
  },
  clanCount: {
    fontSize: 11,
    opacity: 0.55,
  },
  // ── 见证人 ──
  witnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  witnessBadge: {
    backgroundColor: 'rgba(5,150,105,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 40,
    alignItems: 'center',
  },
  witnessBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  witnessContent: {
    flex: 1,
    gap: 1,
  },
  witnessName: {
    fontWeight: '700',
    fontSize: 13,
  },
  witnessParties: {
    fontSize: 11,
    opacity: 0.55,
  },
  // ── 价格 ──
  priceStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(8,145,178,0.08)',
    borderRadius: 8,
  },
  priceStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0891b2',
  },
  priceStatLabel: {
    fontSize: 10,
    opacity: 0.55,
    marginTop: 2,
  },
  priceTrendWrap: {
    gap: 4,
    marginTop: 4,
  },
  priceTrendTitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  priceTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  priceTrendYear: {
    fontSize: 11,
    fontWeight: '600',
    width: 42,
    color: '#0891b2',
  },
  priceTrendBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(8,145,178,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  priceTrendBar: {
    height: '100%',
    backgroundColor: '#0891b2',
    borderRadius: 3,
  },
  priceTrendValue: {
    fontSize: 11,
    opacity: 0.6,
    maxWidth: 100,
  },
  // ── 网络指标 ──
  networkStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  networkStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: 8,
  },
  networkStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  networkStatLabel: {
    fontSize: 10,
    opacity: 0.55,
    marginTop: 2,
  },
  bridgeWrap: {
    gap: 4,
  },
  bridgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  communityWrap: {
    gap: 4,
    marginTop: 2,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  communityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  communityText: {
    fontSize: 12,
    flex: 1,
    opacity: 0.75,
  },
  // ── 地点 ──
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
  // ── 地产流转链 ──
  chainBlock: {
    gap: 4,
  },
  chainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chainDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#b45309',
  },
  chainLocation: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  chainDetail: {
    fontSize: 11,
    opacity: 0.6,
  },
  transferChain: {
    marginLeft: 16,
    gap: 0,
  },
  transferRow: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 28,
  },
  transferLine: {
    width: 12,
    alignItems: 'center',
  },
  transferDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d97706',
    marginTop: 6,
  },
  transferConnector: {
    width: 1.5,
    flex: 1,
    backgroundColor: 'rgba(217,119,6,0.3)',
  },
  transferContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  transferText: {
    fontSize: 12,
    flex: 1,
  },
  transferPrice: {
    fontSize: 11,
    color: '#0891b2',
    fontWeight: '600',
  },
  // ── AI 洞察 ──
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
