<template>
  <div class="bg-surface min-h-[60vh] pt-24 pb-24 px-6">
    <div class="max-w-3xl mx-auto space-y-10">
      <header class="space-y-2">
        <h1 class="text-3xl md:text-4xl font-black text-on-surface tracking-tight font-headline">
          我的在线简历
        </h1>
        <p class="text-sm text-on-surface-variant">
          在此预览已发布的链接或删除不再需要的页面。仅展示本账号在系统内登记过的发布记录。
        </p>
      </header>

      <div v-if="loading" class="text-sm text-on-surface-variant py-12 text-center">加载中…</div>

      <div
        v-else-if="!items.length"
        class="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-lowest/80 p-12 text-center space-y-4"
      >
        <p class="text-on-surface-variant text-sm">暂无已发布的在线简历。</p>
        <router-link
          to="/editor"
          class="inline-flex cta-gradient text-on-primary px-6 py-2.5 rounded-xl font-headline font-bold text-sm shadow-lg"
        >
          去编辑器发布
        </router-link>
      </div>

      <ul v-else class="space-y-4">
        <li
          v-for="row in items"
          :key="row.slug"
          class="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm"
        >
          <div class="min-w-0 space-y-1">
            <p class="font-headline font-bold text-on-surface truncate" :title="previewHref(row)">
              {{ previewHref(row) }}
            </p>
            <p class="text-xs text-on-surface-variant">
              后缀 <code class="text-on-surface font-mono text-[11px]">{{ row.slug }}</code>
              · 发布于 {{ formatTime(row.publishedAt) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0">
            <a
              :href="previewHref(row)"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 rounded-xl text-sm font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-low transition-colors"
            >
              预览
            </a>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-bold text-error hover:bg-error/10 transition-colors"
              @click="onDelete(row)"
            >
              删除
            </button>
          </div>
        </li>
      </ul>
    </div>

    <AppConfirmModal
      v-model="deleteModalOpen"
      title="删除确认"
      :message="deleteModalMessage"
      variant="danger"
      confirm-text="删除"
      cancel-text="取消"
      :confirm-loading="deleteSubmitting"
      loading-text="删除中…"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import AppConfirmModal from '@/components/AppConfirmModal.vue';
import { useAuthStore, type PublishedResumeItem } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const loading = ref(true);
const items = ref<PublishedResumeItem[]>([]);
const deleteModalOpen = ref(false);
const deleteTarget = ref<PublishedResumeItem | null>(null);
const deleteSubmitting = ref(false);

const deleteModalMessage = computed(() =>
  deleteTarget.value
    ? `确定删除「${deleteTarget.value.slug}」的在线简历吗？删除后链接将不可访问。`
    : '',
);

watch(deleteModalOpen, (open) => {
  if (!open) deleteTarget.value = null;
});

function previewHref(row: PublishedResumeItem) {
  const base = authStore.apiBase().replace(/\/$/, '');
  const origin = base || (typeof window !== 'undefined' ? window.location.origin : '');
  const path = row.url.startsWith('/') ? row.url : `/${row.url}`;
  return `${origin}${path}`;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

async function load() {
  loading.value = true;
  const res = await authStore.fetchMyPublishedResumes();
  loading.value = false;
  if (!res.ok) {
    ElMessage.error(res.error);
    items.value = [];
    return;
  }
  items.value = res.items;
}

function onDelete(row: PublishedResumeItem) {
  deleteTarget.value = row;
  deleteModalOpen.value = true;
}

async function confirmDelete() {
  const row = deleteTarget.value;
  if (!row) return;
  deleteSubmitting.value = true;
  const err = await authStore.deletePublishedResume(row.slug);
  deleteSubmitting.value = false;
  if (err) {
    ElMessage.error(err);
    return;
  }
  deleteModalOpen.value = false;
  ElMessage.success('已删除');
  await load();
}

onMounted(async () => {
  await authStore.fetchMe();
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    router.replace('/');
    return;
  }
  await load();
});
</script>
