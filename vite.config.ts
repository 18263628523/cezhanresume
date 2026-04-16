import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 新增 ↓↓↓
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
// 与线上 Nginx 子路径一致：https://autoimages.cn/resume/
export default defineConfig({
  base: '/resume/',

  plugins: [
    vue(),
    vueDevTools(),

    // 自动导入 API
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),

    // 自动导入组件
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // 开发服务器端口（默认 5173）
  server: {
    port: 3000,
    // 监听所有网卡，便于用手机/局域网 IP 访问（如 http://192.168.x.x:3000/resume/）
    host: true,
    // 本地把发布 API 和简历预览转到 Node 服务（默认 3030）
    // 确保先运行：cd server && npm run dev
    proxy: {
      // 所有 /api/* 请求都转到 Node 服务（含 /api/auth、/api/resume）
      '/api': {
        target: 'http://127.0.0.1:3030',
        changeOrigin: true,
      },
      // 用正则精确匹配 /r/ 开头，避免误匹配 /resume/
      '^/r/': {
        target: 'http://127.0.0.1:3030',
        changeOrigin: true,
      },
    },
  },

  // 预览打包结果 `npm run preview`（默认 4173）
  preview: {
    port: 4173,
    host: true,
  },
})