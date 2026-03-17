import React, { useEffect, useRef } from "react";
import { getChartHtml } from "./echartsHtml";

const E_HEIGHT = 450;

export function Chart({ option, onGesture, theme }: 
  { option: any, onGesture: (isBusy: boolean) => void, theme: 'light'|'dark' }) {
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

  // Setup message listener for gesture events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (typeof data === 'string') {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.type === 'gesture') {
            onGesture(parsedData.active);
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onGesture]);

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
        height: `${E_HEIGHT}px`,
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
