export function getChartHtml(option: any, theme: 'light'|'dark') {
  // legend 若为数组取第一项（ECharts 接受对象形式）
  const normalizedOption = { ...option };
  if (Array.isArray(normalizedOption.legend)) {
    // 保留完整的 data 列表，只取第一个 legend 配置对象
    const first = normalizedOption.legend[0] || {};
    normalizedOption.legend = first;
  }

  // 使用window.__ECHARTS_OPTION__来传递数据，避免字符串拼接中文问题
  const optionStr = JSON.stringify(normalizedOption);
  
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        body, html, #main { 
          height: 100%; 
          width: 100%; 
          margin: 0; 
          padding: 0; 
          overflow: hidden; 
          background-color: transparent;
        }
      </style>
      <script src="https://fastly.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    </head>
    <body>
      <div id="main"></div>
      <script>
        var myChart = null;
        var currentTheme = '${theme}';
        window.__ECHARTS_OPTION__ = ${optionStr};

        function initChart(newTheme) {
          if (myChart) {
            myChart.dispose();
          }
          // theme
          myChart = echarts.init(document.getElementById('main'), newTheme === 'dark' ? 'dark' : null);
          // 事件
          myChart.on('click', function(params) {
            var message = {
              type: 'click',
              data: params.name
            };
            if (typeof window.ReactNativeWebView !== 'undefined') {
              window.ReactNativeWebView.postMessage(JSON.stringify(message));
            } else if (window.parent !== window) {
              window.parent.postMessage(JSON.stringify(message), '*');
            }
          });
        }

        function setChartOption(option, newTheme) {
          if (newTheme && newTheme !== currentTheme) {
            currentTheme = newTheme;
            initChart(currentTheme);
          }
          if (!myChart) initChart(currentTheme);
          
          // 规范化legend格式
          if (Array.isArray(option.legend)) {
            option.legend = option.legend[0] || {};
          }
          
          myChart.setOption(option);
        }
        
        // 首次初始化
        initChart(currentTheme);
        setChartOption(window.__ECHARTS_OPTION__);

        // 响应窗口大小变化
        window.addEventListener('resize', function() {
          if (myChart) myChart.resize();
        });

        // 交互逻辑
        var container = document.getElementById('main');
        container.addEventListener('touchstart', function() {
          var message = { type: 'gesture', active: true };
          if (typeof window.ReactNativeWebView !== 'undefined') {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          } else if (window.parent !== window) {
            window.parent.postMessage(JSON.stringify(message), '*');
          }
        }, { passive: true });

        function endGesture() {
          var message = { type: 'gesture', active: false };
          if (typeof window.ReactNativeWebView !== 'undefined') {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          } else if (window.parent !== window) {
            window.parent.postMessage(JSON.stringify(message), '*');
          }
        }
        container.addEventListener('touchend', endGesture);
        container.addEventListener('touchcancel', endGesture);

        // 从父页面接收消息更新图表
        window.addEventListener('message', function(event) {
          var data = event.data;
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch (e) {
              return;
            }
          }
          if (data.type === 'updateChart') {
            setChartOption(data.option, data.theme);
          }
        });
      </script>
    </body>
  </html>
  `;
}