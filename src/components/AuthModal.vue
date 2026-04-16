<template>
  <Teleport to="body">
    <Transition name="auth-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm px-4"
      >
        <div class="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

          <!-- 顶部 Tab -->
          <div class="flex border-b border-outline-variant/20">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="flex-1 py-4 text-sm font-bold transition-colors"
              :class="activeTab === tab.key
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-on-surface-variant hover:text-on-surface'"
              @click="switchTab(tab.key)"
            >{{ tab.label }}</button>
          </div>

          <!-- 内容区：固定高度 + overflow，切换时滑动 -->
          <div class="relative overflow-hidden" :style="{ height: panelHeight }">

            <!-- 登录面板 -->
            <div
              ref="loginPanel"
              class="absolute inset-x-0 top-0 p-8 space-y-5 transition-transform duration-300 ease-in-out"
              :class="activeTab === 'login' ? 'translate-x-0' : '-translate-x-full'"
            >
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-widest text-outline">邮箱</label>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="example@qq.com"
                  autocomplete="email"
                  :disabled="loading"
                  class="w-full bg-surface-container-low ring-1 ring-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed transition-all disabled:opacity-50"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-widest text-outline">密码</label>
                <input
                  v-model="form.password"
                  type="password"
                  placeholder="至少 6 位"
                  autocomplete="current-password"
                  :disabled="loading"
                  class="w-full bg-surface-container-low ring-1 ring-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed transition-all disabled:opacity-50"
                  @keydown.enter="onSubmit"
                />
              </div>
              <p v-if="activeTab === 'login' && errorMsg" class="text-sm text-red-500 font-medium leading-snug">{{ errorMsg }}</p>
              <button
                type="button"
                class="w-full cta-gradient text-on-primary py-3 rounded-xl font-headline font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
                :disabled="loading"
                @click="onSubmit"
              >{{ loading ? '登录中…' : '登 录' }}</button>
            </div>

            <!-- 注册面板 -->
            <div
              ref="registerPanel"
              class="absolute inset-x-0 top-0 p-8 space-y-5 transition-transform duration-300 ease-in-out"
              :class="activeTab === 'register' ? 'translate-x-0' : 'translate-x-full'"
            >
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-widest text-outline">邮箱</label>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="example@qq.com"
                  autocomplete="email"
                  :disabled="loading"
                  class="w-full bg-surface-container-low ring-1 ring-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed transition-all disabled:opacity-50"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-widest text-outline">验证码</label>
                <div class="flex gap-2">
                  <input
                    v-model="form.code"
                    type="text"
                    placeholder="6 位验证码"
                    maxlength="6"
                    :disabled="loading"
                    class="flex-1 bg-surface-container-low ring-1 ring-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    class="shrink-0 px-3 py-2 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface hover:bg-surface-container transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
                    :disabled="codeCooldown > 0 || loading || sendingCode"
                    @click="onSendCode"
                  >{{ sendingCode ? '发送中…' : codeCooldown > 0 ? `${codeCooldown}s 后重发` : '发送验证码' }}</button>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-widest text-outline">密码</label>
                <input
                  v-model="form.password"
                  type="password"
                  placeholder="至少 6 位"
                  :disabled="loading"
                  class="w-full bg-surface-container-low ring-1 ring-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed transition-all disabled:opacity-50"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-widest text-outline">确认密码</label>
                <input
                  v-model="form.confirm"
                  type="password"
                  placeholder="再次输入密码"
                  :disabled="loading"
                  class="w-full bg-surface-container-low ring-1 ring-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed transition-all disabled:opacity-50"
                  @keydown.enter="onSubmit"
                />
              </div>
              <p v-if="activeTab === 'register' && errorMsg" class="text-sm text-red-500 font-medium leading-snug">{{ errorMsg }}</p>
              <button
                type="button"
                class="w-full cta-gradient text-on-primary py-3 rounded-xl font-headline font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
                :disabled="loading"
                @click="onSubmit"
              >{{ loading ? '注册中…' : '注 册' }}</button>
            </div>

          </div><!-- /内容区 -->
        </div>

        <!-- 关闭按钮：卡片外部正下方 -->
        <button
          type="button"
          class="opacity-70 hover:opacity-100 transition-opacity active:scale-90"
          @click="$emit('update:modelValue', false)"
        >
          <img src="@/assets/images/Close.png" alt="关闭" class="w-10 h-10" />
        </button>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{ modelValue: boolean }>();
const emit  = defineEmits<{
  'update:modelValue': [val: boolean];
  'success': [];
}>();

const authStore = useAuthStore();

const tabs = [
  { key: 'login',    label: '登 录' },
  { key: 'register', label: '注 册' },
] as const;
type TabKey = 'login' | 'register';

const activeTab   = ref<TabKey>('login');
const loading     = ref(false);
const sendingCode = ref(false);
const errorMsg    = ref('');
const codeCooldown = ref(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const form = reactive({ email: '', password: '', confirm: '', code: '' });

// ── 动态高度：让容器始终等于当前面板高度，两个面板高度统一取最高值 ──
const loginPanel    = ref<HTMLElement | null>(null);
const registerPanel = ref<HTMLElement | null>(null);
const panelHeight   = ref('auto');

async function recalcHeight() {
  await nextTick();
  const lh = loginPanel.value?.scrollHeight   ?? 0;
  const rh = registerPanel.value?.scrollHeight ?? 0;
  panelHeight.value = `${Math.max(lh, rh)}px`;
}

watch(() => props.modelValue, async (v) => {
  if (v) {
    errorMsg.value = '';
    await recalcHeight();
  }
});

// 监听 tab 切换也重算（确保错误信息显示后高度正确）
watch(errorMsg, recalcHeight);
onMounted(recalcHeight);

function switchTab(tab: TabKey) {
  activeTab.value = tab;
  errorMsg.value  = '';
  form.code = '';
  form.confirm = '';
  form.password = '';
}

async function onSendCode() {
  const email = form.email.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMsg.value = '请先填写正确的邮箱地址';
    return;
  }
  errorMsg.value = '';
  sendingCode.value = true;
  const err = await authStore.sendCode(email);
  sendingCode.value = false;
  if (err) { errorMsg.value = err; return; }
  ElMessage.success('验证码已发送，请查收邮件');
  codeCooldown.value = 60;
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    if (--codeCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

async function onSubmit() {
  errorMsg.value = '';
  const { email, password, confirm, code } = form;
  if (!email.trim())    { errorMsg.value = '请填写邮箱'; return; }
  if (!password.trim()) { errorMsg.value = '请填写密码'; return; }
  if (activeTab.value === 'register') {
    if (!code.trim())          { errorMsg.value = '请填写验证码'; return; }
    if (password.length < 6)  { errorMsg.value = '密码至少 6 位'; return; }
    if (password !== confirm)  { errorMsg.value = '两次密码不一致'; return; }
  }
  loading.value = true;
  const err = activeTab.value === 'login'
    ? await authStore.login(email.trim(), password)
    : await authStore.register(email.trim(), code.trim(), password);
  loading.value = false;
  if (err) { errorMsg.value = err; return; }
  ElMessage.success(activeTab.value === 'login' ? '登录成功' : '注册成功');
  emit('update:modelValue', false);
  emit('success');
}
</script>

<style scoped>
.Closebuttonhidden {
  position: relative;
}
.Closebutton {
  position: absolute;
  top: 10px;
  right: 10px;
}
/* 弹窗整体出现动画 */
.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: opacity 220ms ease;
}
.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
}
.auth-fade-enter-active > div > div,
.auth-fade-leave-active > div > div {
  transition: transform 220ms ease;
}
.auth-fade-enter-from > div > div,
.auth-fade-leave-to > div > div {
  transform: scale(0.96) translateY(10px);
}
</style>
