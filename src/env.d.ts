/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 发布 API 根地址（不含末尾 /），留空表示与前端同源。
   * 开发：留空（Vite proxy 转发到 server:3030）
   * 生产：留空（Nginx 反代 /api/resume 和 /r 到 3030）
   */
  readonly VITE_PUBLISH_API_BASE?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
