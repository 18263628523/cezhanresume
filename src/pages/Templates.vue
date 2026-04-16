<template>
  <div class="bg-surface min-h-screen pt-32 pb-24 px-6">
    <div class="max-w-7xl mx-auto space-y-14">
      <header class="text-center space-y-5 max-w-4xl mx-auto">
        <h1 class="text-5xl lg:text-7xl font-black text-on-surface tracking-tighter font-headline leading-tight">
          选择你的<br />
          <span class="text-primary italic">简历模板</span>
        </h1>
        <p class="text-lg text-on-surface-variant font-body leading-relaxed">
          无论您是初入职场还是资深专家，我们都有最适合您的设计。所有模板均经过 ATS 优化，确保您的简历能被顺利读取。
        </p>
      </header>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="px-5 py-2.5 rounded-xl font-headline font-bold text-sm transition-all active:scale-95"
          :class="activeCategory === cat ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article
          v-for="tpl in filteredTemplates"
          :key="tpl.id"
          class="group bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xl border border-outline-variant/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div class="aspect-[4/5] p-6 bg-surface-container-low relative">
            <div class="absolute top-4 left-4 bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-black tracking-wider">
              {{ tpl.category }}
            </div>
            <div class="h-full rounded-2xl bg-white shadow-md p-5 flex flex-col gap-4">
              <div class="h-1.5 rounded-full" :style="{ backgroundColor: tpl.accent }"></div>
              <div class="space-y-1.5">
                <div class="h-5 w-2/3 rounded" :style="{ backgroundColor: tint(tpl.accent, 0.18) }"></div>
                <div class="h-2.5 w-1/2 rounded bg-slate-200/80"></div>
              </div>
              <div class="space-y-2 pt-2">
                <div class="h-2.5 rounded bg-slate-200/80"></div>
                <div class="h-2.5 rounded bg-slate-200/80"></div>
                <div class="h-2.5 w-11/12 rounded bg-slate-200/80"></div>
              </div>
              <div class="mt-auto flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full border-2" :style="{ borderColor: tpl.accent }"></span>
                <span class="text-[10px] text-on-surface-variant font-bold tracking-wide">{{ tpl.layoutLabel }}</span>
              </div>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <h3 class="text-xl font-black text-on-surface font-headline tracking-tight">{{ tpl.name }}</h3>
              <p class="text-sm text-on-surface-variant mt-1 leading-relaxed">{{ tpl.blurb }}</p>
            </div>
            <router-link
              :to="{ path: '/editor', query: { template: tpl.id } }"
              class="inline-flex items-center justify-center w-full bg-primary text-on-primary px-5 py-3 rounded-xl font-headline font-bold text-sm hover:opacity-90 transition-all active:scale-95"
            >
              使用此模板
            </router-link>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

type TemplateItem = {
  id: string;
  name: string;
  blurb: string;
  accent: string;
  layout: string;
  category: '现代专业' | '创意设计' | '极简主义' | '高管精英' | '时间轴';
  layoutLabel: string;
};

const templates: TemplateItem[] = [
  { id: 'compact', name: '精简专业', blurb: '默认小字号 + 紧凑版面，信息密度高。', accent: '#004ac6', layout: 'modern', category: '现代专业', layoutLabel: '现代布局' },
  { id: 'modern', name: '现代专业版', blurb: '标准字号与留白，大标题视觉。', accent: '#004ac6', layout: 'modern', category: '现代专业', layoutLabel: '现代布局' },
  { id: 'minimal', name: '极简留白', blurb: '中性灰分割、简洁留白阅读感。', accent: '#37474f', layout: 'minimal', category: '极简主义', layoutLabel: '极简布局' },
  { id: 'executive', name: '经典商务', blurb: '衬线风格、紧凑结构，适合商务岗位。', accent: '#1a237e', layout: 'executive', category: '高管精英', layoutLabel: '商务布局' },
  { id: 'creative', name: '创意设计', blurb: '标签式标题与彩色强调，偏设计岗位。', accent: '#7b1fa2', layout: 'creative', category: '创意设计', layoutLabel: '创意布局' },
  { id: 'stripe', name: '侧边线谱', blurb: '左侧竖色条，视觉层次清晰。', accent: '#00796b', layout: 'stripe', category: '现代专业', layoutLabel: '线谱布局' },
  { id: 'magazine', name: '杂志大片', blurb: '居中标题区，突出品牌感与视觉张力。', accent: '#c2185b', layout: 'magazine', category: '创意设计', layoutLabel: '杂志布局' },
  { id: 'tech', name: '极客工程', blurb: '等宽感标题与高信息密度。', accent: '#00838f', layout: 'tech', category: '现代专业', layoutLabel: '工程布局' },
  { id: 'elegant', name: '雅致书卷', blurb: '衬线标题与温和配色，偏学术文职。', accent: '#5d4037', layout: 'elegant', category: '高管精英', layoutLabel: '书卷布局' },
  { id: 'timeline', name: '职业时间轴', blurb: '纵向时间轴强调职业成长轨迹。', accent: '#6a1b9a', layout: 'timeline', category: '时间轴', layoutLabel: '时间轴布局' },
];

const categories = ['全部', '现代专业', '创意设计', '极简主义', '高管精英', '时间轴'] as const;
const activeCategory = ref<(typeof categories)[number]>('全部');

const filteredTemplates = computed(() => {
  if (activeCategory.value === '全部') return templates;
  return templates.filter((t) => t.category === activeCategory.value);
});

function tint(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
</script>
