<template>
  <Teleport to="body">
    <Transition name="feedback-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[280] flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm px-4"
        @click.self="close"
      >
        <div class="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 space-y-5">
          <div class="space-y-1">
            <h2 class="text-xl font-black text-on-surface font-headline">提意见</h2>
            <p class="text-sm text-on-surface-variant">
              欢迎反馈问题、功能建议或使用体验，我们会认真阅读。
            </p>
          </div>

          <div v-if="submitted" class="py-6 text-center space-y-3">
            <span class="material-symbols-outlined text-5xl text-primary">check_circle</span>
            <p class="text-sm font-medium text-on-surface">感谢反馈，我们已收到。</p>
            <button
              type="button"
              class="text-sm font-bold text-primary hover:underline"
              @click="close"
            >关闭</button>
          </div>

          <template v-else>
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-widest text-outline">意见内容（必填）</label>
              <textarea
                v-model="message"
                rows="5"
                placeholder="请描述您遇到的问题或建议…"
                :disabled="loading"
                class="w-full bg-surface-container-low ring-1 ring-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed transition-all resize-none disabled:opacity-50 placeholder:text-on-surface-variant/50"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-widest text-outline">联系邮箱（选填）</label>
              <input
                v-model="email"
                type="email"
                placeholder="方便我们回复时填写"
                autocomplete="email"
                :disabled="loading"
                class="w-full bg-surface-container-low ring-1 ring-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-fixed transition-all disabled:opacity-50"
              />
            </div>
            <p v-if="errorMsg" class="text-sm text-red-500 font-medium leading-snug">{{ errorMsg }}</p>
            <div class="flex gap-3 pt-1">
              <button
                type="button"
                class="flex-1 bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all disabled:opacity-50"
                :disabled="loading"
                @click="close"
              >取消</button>
              <button
                type="button"
                class="flex-1 cta-gradient text-on-primary px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
                :disabled="loading"
                @click="submit"
              >{{ loading ? '提交中…' : '提交' }}</button>
            </div>
          </template>
        </div>

        <button
          type="button"
          class="opacity-70 hover:opacity-100 transition-opacity active:scale-90"
          aria-label="关闭"
          @click="close"
        >
          <img src="@/assets/images/Close.png" alt="" class="w-10 h-10" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [val: boolean] }>();

const authStore = useAuthStore();
const route = useRoute();

const message = ref('');
const email = ref('');
const loading = ref(false);
const errorMsg = ref('');
const submitted = ref(false);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      message.value = '';
      errorMsg.value = '';
      submitted.value = false;
      email.value = authStore.user?.email ?? '';
    }
  },
);

function close() {
  emit('update:modelValue', false);
}

async function submit() {
  errorMsg.value = '';
  const msg = message.value.trim();
  if (msg.length < 5) {
    errorMsg.value = '请至少填写 5 个字';
    return;
  }
  const em = email.value.trim();
  if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    errorMsg.value = '邮箱格式不正确';
    return;
  }

  const base = authStore.apiBase();
  const page =
    typeof window !== 'undefined'
      ? `${window.location.origin}${route.fullPath}`
      : route.fullPath;

  loading.value = true;
  try {
    const res = await fetch(`${base}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        email: em,
        page,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      errorMsg.value = data.error ?? '提交失败，请稍后重试';
      return;
    }
    submitted.value = true;
  } catch {
    errorMsg.value = '网络错误，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.feedback-fade-enter-active,
.feedback-fade-leave-active {
  transition: opacity 220ms ease;
}
.feedback-fade-enter-from,
.feedback-fade-leave-to {
  opacity: 0;
}
.feedback-fade-enter-active > div > div,
.feedback-fade-leave-active > div > div {
  transition: transform 220ms ease;
}
.feedback-fade-enter-from > div > div,
.feedback-fade-leave-to > div > div {
  transform: scale(0.96) translateY(10px);
}
</style>
