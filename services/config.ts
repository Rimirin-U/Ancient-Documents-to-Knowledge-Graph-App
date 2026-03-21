// services/config.ts
// 公网 / 真机：在项目根目录建 .env，写入 EXPO_PUBLIC_API_BASE_URL=http://公网IP:端口 后重启 npx expo start
// 本地本机调试：可改为 http://localhost:3000 或 http://局域网IP:3000
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '');
const fallback = 'http://8.162.9.49:3000';

export const API_BASE_URL = fromEnv && fromEnv.length > 0 ? fromEnv : fallback;
