import { API_BASE_URL, apiFetch } from './api';

export type TimePoint = { year: number; count: number };
export type LocationPoint = { name: string; count: number };
export type PersonPoint = { name: string; count: number };
export type PriceTrendPoint = { year: number; avg_price: number; count: number };

export type StatisticsData = {
  total_images: number;
  total_analyzed: number;
  time_range: { start?: number; end?: number; span?: number };
  time_distribution: TimePoint[];
  location_distribution: LocationPoint[];
  top_people: PersonPoint[];
  price_trend: PriceTrendPoint[];
};

type StatisticsResponse = {
  success: boolean;
  data: StatisticsData;
  detail?: string;
};

export async function fetchStatistics(): Promise<StatisticsData> {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/statistics`);

  const rawText = await response.text();
  let result: StatisticsResponse;
  try {
    result = JSON.parse(rawText) as StatisticsResponse;
  } catch {
    throw new Error(`服务器响应异常 (HTTP ${response.status})`);
  }

  if (!response.ok || !result.success) {
    throw new Error(result.detail || '获取统计数据失败');
  }

  return result.data;
}
