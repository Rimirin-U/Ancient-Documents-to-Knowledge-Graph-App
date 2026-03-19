import { StructuredDisplayItem } from '@/components/image-detail/structured-content-list';

export const STRUCTURED_FIELD_LABELS: Record<string, string> = {
  Time: '时间',
  Time_AD: '公历年份',
  Location: '地点',
  Seller: '卖方',
  Buyer: '买方',
  Middleman: '中人',
  Price: '价格',
  Subject: '标的',
  Translation: '译文',
};

function formatStructuredValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// 预设字段展示顺序（Translation 固定在最后）
const FIELD_ORDER = Object.keys(STRUCTURED_FIELD_LABELS);

export function toStructuredDisplayItems(
  content?: Record<string, unknown>
): StructuredDisplayItem[] {
  if (!content) return [];

  return FIELD_ORDER
    .filter((key) => key in content)
    .map((key) => ({
      key,
      label: STRUCTURED_FIELD_LABELS[key],
      value: formatStructuredValue(content[key]),
    }))
    .filter((item) => Boolean(item.value));
}
