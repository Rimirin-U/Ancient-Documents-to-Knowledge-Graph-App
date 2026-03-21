import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColor } from '@/hooks/useColor';
import {
  fetchStatistics,
  LocationPoint,
  PersonPoint,
  PriceTrendPoint,
  StatisticsData,
  TimePoint,
} from '@/services/statistics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

// ── 简易条形图 ────────────────────────────────────────────────

function BarChart({
  data,
  labelKey,
  valueKey,
  maxBars = 8,
  barColor,
}: {
  data: any[];
  labelKey: string;
  valueKey: string;
  maxBars?: number;
  barColor: string;
}) {
  const items = data.slice(0, maxBars);
  if (!items.length) return <ThemedText style={styles.emptyHint}>暂无数据</ThemedText>;

  const maxVal = Math.max(...items.map((d) => d[valueKey] as number));

  return (
    <View style={styles.chartWrap}>
      {items.map((item, i) => {
        const pct = maxVal > 0 ? (item[valueKey] / maxVal) * 100 : 0;
        return (
          <View key={i} style={styles.barRow}>
            <ThemedText style={styles.barLabel} numberOfLines={1}>
              {String(item[labelKey])}
            </ThemedText>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <ThemedText style={styles.barValue}>{item[valueKey]}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

// ── 折线图（简化版，用宽度/位置模拟点位）────────────────────

function LineChart({
  data,
  xKey,
  yKey,
  lineColor,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  lineColor: string;
}) {
  if (data.length < 2)
    return <ThemedText style={styles.emptyHint}>数据点不足，暂无趋势图</ThemedText>;

  const maxY = Math.max(...data.map((d) => d[yKey] as number));
  const CHART_H = 80;

  return (
    <View>
      <View style={[styles.lineChartArea, { height: CHART_H + 30 }]}>
        {data.map((pt, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = maxY > 0 ? (1 - pt[yKey] / maxY) * CHART_H : CHART_H;
          return (
            <View
              key={i}
              style={[
                styles.linePoint,
                {
                  left: `${x}%` as any,
                  top: y,
                  backgroundColor: lineColor,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.lineXLabels}>
        {data
          .filter((_, i) => i % Math.max(1, Math.floor(data.length / 4)) === 0)
          .map((pt, i) => (
            <ThemedText key={i} style={styles.lineXLabel}>
              {pt[xKey]}
            </ThemedText>
          ))}
      </View>
    </View>
  );
}

// ── 统计卡片 ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  cardBg,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  cardBg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: cardBg }]}>
      <MaterialIcons name={icon as any} size={22} color={color} />
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

// ── 主页面 ────────────────────────────────────────────────────

export default function StatisticsScreen() {
  const pageBg = useColor('screen');
  const cardBg = useColor('card');
  const sectionBg = useColor('card');
  const borderColor = useColor('border');
  const textColor = useColor('text');
  const BLUE = useColor('blue');
  const GREEN = useColor('green');
  const AMBER = useColor('orange');
  const PURPLE = useColor('purple');
  const RED = useColor('red');

  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const stats = await fetchStatistics();
      setData(stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  if (loading) {
    return (
      <ThemedView style={[styles.center, { backgroundColor: pageBg }]}>
        <ActivityIndicator size="large" color={BLUE} />
        <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>加载统计数据...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.center, { backgroundColor: pageBg }]}>
        <MaterialIcons name="error-outline" size={48} color={RED} />
        <ThemedText style={{ marginTop: 8, opacity: 0.7 }}>{error}</ThemedText>
        <Pressable style={[styles.retryBtn, { borderColor }]} onPress={() => loadData()}>
          <ThemedText style={{ color: BLUE }}>重试</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!data) return null;

  const analysisRate =
    data.total_images > 0
      ? Math.round((data.total_analyzed / data.total_images) * 100)
      : 0;

  return (
    <ScrollView
      style={{ backgroundColor: pageBg }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 概览卡片 */}
      <View style={styles.statCardRow}>
        <StatCard label="文书总数" value={data.total_images} icon="description" color={BLUE} cardBg={cardBg} />
        <StatCard label="已分析" value={data.total_analyzed} icon="analytics" color={GREEN} cardBg={cardBg} />
        <StatCard label="分析率" value={`${analysisRate}%`} icon="pie-chart" color={AMBER} cardBg={cardBg} />
        {data.time_range?.span != null && (
          <StatCard
            label="时间跨度"
            value={`${data.time_range.span}年`}
            icon="history"
            color={PURPLE}
            cardBg={cardBg}
          />
        )}
      </View>

      {/* 时间分布 */}
      {data.time_distribution.length > 0 && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>📅 文书年代分布</ThemedText>
          {data.time_range?.start != null && (
            <ThemedText style={[styles.sectionSubtitle, { color: textColor }]}>
              公元 {data.time_range.start} — {data.time_range.end} 年
            </ThemedText>
          )}
          <LineChart data={data.time_distribution} xKey="year" yKey="count" lineColor={BLUE} />
        </View>
      )}

      {/* 地点分布 */}
      {data.location_distribution.length > 0 && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>📍 交易地点 Top10</ThemedText>
          <BarChart
            data={data.location_distribution}
            labelKey="name"
            valueKey="count"
            barColor={GREEN}
          />
        </View>
      )}

      {/* 核心人物 */}
      {data.top_people.length > 0 && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>👤 高频人物 Top10</ThemedText>
          <BarChart
            data={data.top_people}
            labelKey="name"
            valueKey="count"
            barColor={PURPLE}
          />
        </View>
      )}

      {/* 价格趋势 */}
      {data.price_trend.length >= 2 && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>💰 地价趋势</ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: textColor }]}>
            平均交易价格随时间变化
          </ThemedText>
          <LineChart
            data={data.price_trend}
            xKey="year"
            yKey="avg_price"
            lineColor={AMBER}
          />
        </View>
      )}

      {data.total_images === 0 && (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="upload-file" size={56} color={borderColor} />
          <ThemedText style={[styles.emptyTitle, { color: borderColor }]}>
            还没有上传文书
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: borderColor }]}>
            前往「首页」上传地契图片{'\n'}系统将自动识别并提取结构化信息
          </ThemedText>
        </View>
      )}

      {data.total_images > 0 && data.total_analyzed === 0 && (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="hourglass-empty" size={56} color={borderColor} />
          <ThemedText style={[styles.emptyTitle, { color: borderColor }]}>
            分析进行中
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: borderColor }]}>
            已上传 {data.total_images} 份文书，AI 正在识别与分析{'\n'}分析完成后统计图表将自动显示
          </ThemedText>
          <Pressable style={[styles.retryBtn, { borderColor }]} onPress={() => loadData()}>
            <ThemedText style={{ color: BLUE }}>刷新</ThemedText>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  statCardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: 80,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, opacity: 0.6, textAlign: 'center' },
  section: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12, opacity: 0.6 },
  chartWrap: { gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 72, fontSize: 11, opacity: 0.8 },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 7 },
  barValue: { width: 28, fontSize: 11, textAlign: 'right', opacity: 0.7 },
  lineChartArea: { position: 'relative', width: '100%' },
  linePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  lineXLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  lineXLabel: { fontSize: 10, opacity: 0.6 },
  emptyHint: { fontSize: 13, opacity: 0.5, textAlign: 'center', paddingVertical: 8 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20, opacity: 0.7 },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
