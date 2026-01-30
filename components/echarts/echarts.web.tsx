import * as echarts from "echarts";
import React, { useEffect, useRef } from "react";

const E_HEIGHT = 350;

export function Chart({ option, onGesture, theme }: 
  { option: any, onGesture: (isBusy: boolean) => void, theme: 'light'|'dark' }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Initialize chart instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Dispose previous instance if exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    // Initialize new chart with theme
    const chartInstance = echarts.init(
      chartContainerRef.current,
      theme === 'dark' ? 'dark' : 'light'
    );

    chartInstanceRef.current = chartInstance;

    // Handle chart click events
    chartInstance.on('click', (params: any) => {
      console.log('Chart click:', params.name);
    });

    // Handle window resize
    const handleResize = () => {
      chartInstance.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  // Update chart option when it changes
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.setOption(option);
    }
  }, [option]);

  // Handle gesture events
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleTouchStart = () => {
      onGesture(true);
    };

    const handleTouchEnd = () => {
      onGesture(false);
    };

    const handleTouchCancel = () => {
      onGesture(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onGesture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={chartContainerRef}
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
    />
  );
}
