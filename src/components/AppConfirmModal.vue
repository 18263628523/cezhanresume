<template>
  <Teleport to="body">
    <Transition name="app-confirm-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[500] flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm px-4"
        @click.self="close"
      >
        <div
          class="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 space-y-5 border border-outline-variant/15"
        >
          <div class="flex items-start gap-3">
            <span
              v-if="variant === 'danger'"
              class="material-symbols-outlined text-3xl text-error shrink-0"
              aria-hidden="true"
            >warning</span>
            <div class="space-y-2 min-w-0 flex-1">
              <h2 class="text-xl font-black text-on-surface font-headline leading-tight">{{ title }}</h2>
              <p class="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{{ message }}</p>
            </div>
          </div>

          <div class="flex gap-3 pt-1">
            <button
              type="button"
              class="flex-1 bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all disabled:opacity-50"
              :disabled="confirmLoading"
              @click="close"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
              :class="
                variant === 'danger'
                  ? 'bg-error/10 text-error ring-1 ring-error/35 hover:bg-error/15'
                  : 'cta-gradient text-on-primary'
              "
              :disabled="confirmLoading"
              @click="emit('confirm')"
            >
              {{ confirmLoading ? loadingText : confirmText }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="opacity-70 hover:opacity-100 transition-opacity active:scale-90"
          aria-label="关闭"
          :disabled="confirmLoading"
          @click="close"
        >
          <img src="@/assets/images/Close.png" alt="" class="w-10 h-10" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    /** danger：删除等危险操作的主按钮样式 */
    variant?: 'primary' | 'danger';
    confirmLoading?: boolean;
    loadingText?: string;
  }>(),
  {
    confirmText: '确定',
    cancelText: '取消',
    variant: 'primary',
    confirmLoading: false,
    loadingText: '请稍候…',
  },
);

const emit = defineEmits<{
  'update:modelValue': [val: boolean];
  confirm: [];
}>();

function close() {
  if (props.confirmLoading) return;
  emit('update:modelValue', false);
}
</script>

<style scoped>
.app-confirm-fade-enter-active,
.app-confirm-fade-leave-active {
  transition: opacity 220ms ease;
}
.app-confirm-fade-enter-from,
.app-confirm-fade-leave-to {
  opacity: 0;
}
.app-confirm-fade-enter-active > div > div,
.app-confirm-fade-leave-active > div > div {
  transition: transform 220ms ease;
}
.app-confirm-fade-enter-from > div > div,
.app-confirm-fade-leave-to > div > div {
  transform: scale(0.96) translateY(10px);
}
</style>
