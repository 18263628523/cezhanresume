import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia'
import './index.css';
// 函数式 API（ElMessage、ElMessageBox 等）不会走模板按需样式，需全量样式才有居中遮罩弹窗
import 'element-plus/dist/index.css';
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const app = createApp(App);
const pinia = createPinia()
app.use(ElementPlus, {
  locale: zhCn,
})
app.use(router);
app.use(pinia)
app.mount('#app');
