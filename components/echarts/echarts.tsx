import React, { useEffect, useRef } from "react";
import { getChartHtml } from "./echartsHtml";

const E_HEIGHT = 450;

/** 与 echartsHtml 内 postMessage 的 nodeClick 载荷一致 */
export type NodeClickData = {
  name: string;
  category: number | null;
  symbolSize: number | null;
  properties: unknown;
  seriesType: string | null;
};

type ChartProps = {
  option: any;
  onGesture: (isBusy: boolean) => void;
  theme: "light" | "dark";
  height?: number;
  /** iframe 内 ECharts 节点点击（Web 端） */
  onNodeClick?: (node: NodeClickData) => void;
};

export function Chart({ option, onGesture, theme, height = 450, onNodeClick }: ChartProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // on option change - send message to iframe
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;

    // legend 若为数组取第一项（ECharts 接受对象形式）
    const normalizedOption = { ...option };
    if (Array.isArray(normalizedOption.legend)) {
      normalizedOption.legend = normalizedOption.legend[0] || {};
    }

    const message = {
      type: 'updateChart',
      option: normalizedOption,
      theme: theme
    };
    iframeRef.current.contentWindow.postMessage(JSON.stringify(message), '*');
  }, [option, theme]);

  // iframe 手势 + 节点点击
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (typeof data !== "string") return;
      try {
        const parsedData = JSON.parse(data) as {
          type?: string;
          active?: boolean;
          name?: string;
          category?: number | null;
          symbolSize?: number | null;
          properties?: unknown;
          seriesType?: string | null;
        };
        if (parsedData.type === "gesture" && typeof parsedData.active === "boolean") {
          onGesture(parsedData.active);
          return;
        }
        if (parsedData.type === "nodeClick" && onNodeClick) {
          onNodeClick({
            name: String(parsedData.name ?? ""),
            category:
              parsedData.category === undefined || parsedData.category === null
                ? null
                : Number(parsedData.category),
            symbolSize:
              parsedData.symbolSize === undefined || parsedData.symbolSize === null
                ? null
                : Number(parsedData.symbolSize),
            properties: parsedData.properties ?? null,
            seriesType: parsedData.seriesType != null ? String(parsedData.seriesType) : null,
          });
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onGesture, onNodeClick]);

  // Create blob URL for iframe
  const iframeHtml = getChartHtml(option, theme);
  const blobUrl = React.useMemo(() => {
    const blob = new Blob([iframeHtml], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [iframeHtml]);

  return (
    <div
      style={{
        width: 'calc(100% - 32px)',
        height: `${height}px`,
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderWidth: '1px',
        margin: '0 16px',
      }}
    >
      <iframe
        ref={iframeRef}
        src={blobUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '16px',
        }}
        title="echarts"
      />
    </div>
  );
}
