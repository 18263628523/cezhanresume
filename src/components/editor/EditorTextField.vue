<script setup lang="ts">
const model = defineModel<string>({ required: true });

defineProps<{
  label: string;
  type?: 'text' | 'email' | 'tel' | 'month';
}>();
</script>

<template>
  <div class="space-y-2">
    <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">{{ label }}</label>
    <input
      v-model="model"
      :type="type ?? 'text'"
      class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
    />
  </div>
</template>
