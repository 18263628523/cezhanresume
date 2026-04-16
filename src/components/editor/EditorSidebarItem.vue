<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ click: [] }>();

function onClick() {
  emit('click');
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="w-full flex items-center gap-3 px-4 py-3 transition-all rounded-lg font-body text-sm font-medium disabled:opacity-45 disabled:pointer-events-none"
    :class="
      active
        ? 'bg-surface-container-lowest text-primary shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container-high'
    "
    @click="onClick"
  >
    <span
      class="material-symbols-outlined"
      :style="active ? { fontVariationSettings: '\'FILL\' 1' } : undefined"
    >{{ icon }}</span>
    {{ label }}
  </button>
</template>
