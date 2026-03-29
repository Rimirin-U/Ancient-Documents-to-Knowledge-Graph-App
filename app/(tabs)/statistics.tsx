import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Chart } from '@/components/echarts/echarts';
import {
  fetchStatistics,
  StatisticsData,
} from '@/services/statistics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

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
  const colorScheme = useColorScheme() ?? 'light';

  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [chartBusy, setChartBusy] = useState(false);

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

  const timeDistributionOption = useMemo(() => {
    if (!data?.time_distribution.length) return null;
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: data.time_distribution.map((d) => d.year) },
      yAxis: { type: 'value' },
      series: [
        {
          data: data.time_distribution.map((d) => d.count),
          type: 'line',
          smooth: true,
          itemStyle: { color: BLUE },
          areaStyle: { opacity: 0.2, color: BLUE },
        },
      ],
    };
  }, [data, BLUE]);

  const locationDistributionOption = useMemo(() => {
    if (!data?.location_distribution.length) return null;
    const sorted = [...data.location_distribution].reverse();
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '10%', bottom: '3%', top: '5%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: sorted.map((d) => d.name) },
      series: [
        {
          data: sorted.map((d) => d.count),
          type: 'bar',
          itemStyle: { color: GREEN, borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right' }
        },
      ],
    };
  }, [data, GREEN]);

  const topPeopleOption = useMemo(() => {
    if (!data?.top_people.length) return null;
    const sorted = [...data.top_people].reverse();
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '10%', bottom: '3%', top: '5%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: sorted.map((d) => d.name) },
      series: [
        {
          data: sorted.map((d) => d.count),
          type: 'bar',
          itemStyle: { color: PURPLE, borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right' }
        },
      ],
    };
  }, [data, PURPLE]);

  const priceTrendOption = useMemo(() => {
    if (!data || data.price_trend.length < 2) return null;
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: data.price_trend.map((d) => d.year) },
      yAxis: { type: 'value' },
      series: [
        {
          data: data.price_trend.map((d) => d.avg_price),
          type: 'line',
          smooth: true,
          itemStyle: { color: AMBER },
        },
      ],
    };
  }, [data, AMBER]);

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
      scrollEnabled={!chartBusy}
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
      {timeDistributionOption && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>📅 文书年代分布</ThemedText>
          {data.time_range?.start != null && (
            <ThemedText style={[styles.sectionSubtitle, { color: textColor }]}>
              公元 {data.time_range.start} — {data.time_range.end} 年
            </ThemedText>
          )}
          <Chart option={timeDistributionOption} theme={colorScheme} onGesture={setChartBusy} height={250} />
        </View>
      )}

      {/* 地点分布 */}
      {locationDistributionOption && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>📍 交易地点 Top10</ThemedText>
          <Chart option={locationDistributionOption} theme={colorScheme} onGesture={setChartBusy} height={300} />
        </View>
      )}

      {/* 核心人物 */}
      {topPeopleOption && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>👤 高频人物 Top10</ThemedText>
          <Chart option={topPeopleOption} theme={colorScheme} onGesture={setChartBusy} height={300} />
        </View>
      )}

      {/* 价格趋势 */}
      {priceTrendOption && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>💰 地价趋势</ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: textColor }]}>
            平均交易价格随时间变化
          </ThemedText>
          <Chart option={priceTrendOption} theme={colorScheme} onGesture={setChartBusy} height={250} />
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
  statValue: { fontSize: 20, fontWeight: 'bold' },
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