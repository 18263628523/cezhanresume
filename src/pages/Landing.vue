<template>
  <div class="bg-surface overflow-hidden">
    <!-- Hero Section -->
    <section class="relative pb-20 px-6 overflow-hidden">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div class="space-y-10 relative z-10">
          <div class="inline-flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span class="text-xs font-bold text-primary uppercase tracking-widest">AI 驱动的职业叙事</span>
          </div>
          
          <h1 class="text-6xl lg:text-6xl font-black text-on-surface leading-[0.9] tracking-tighter font-headline">
            提升您的职场履历，<br />
            <span class="text-primary italic">成就非凡未来。</span>
          </h1>
          
          <p class="text-xl text-on-surface-variant leading-relaxed max-w-lg font-body">
            几分钟内完成精美简历的构建、编辑与发布。策展简历通过 AI 优化您的职业故事，让您在竞争中脱颖而出。
          </p>
          
          <div class="flex flex-col sm:flex-row items-center gap-6 pt-4">
            <router-link to="/editor" class="cta-gradient text-on-primary px-10 py-5 rounded-2xl font-headline font-bold text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all w-full sm:w-auto text-center">
              免费制作简历
            </router-link>
            <router-link to="/templates" class="text-on-surface font-headline font-bold text-lg hover:text-primary transition-colors flex items-center gap-2 group">
              查看示例
              <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </router-link>
          </div>
          
          <div class="pt-10 flex items-center gap-6">
            <div class="flex -space-x-3">
              <img v-for="i in 4" :key="i" :src="home1Img" class="w-10 h-10 rounded-full border-2 border-surface shadow-sm" alt="User avatar" referrerPolicy="no-referrer" />
            </div>
            <p class="text-sm text-on-surface-variant font-medium">
              <span class="text-on-surface font-bold">10,000+</span> 位职场精英的选择
            </p>
          </div>
        </div>

        <div class="relative">
          <div class="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
          
          <div class="relative glass-card rounded-3xl p-4 shadow-2xl premium-shadow border border-white/20 transform rotate-2 hover:rotate-0 transition-transform duration-700">
            <img 
              src="https://lh3.googleusercontent.com/d/1v-A7_Y7_Y7_Y7_Y7_Y7_Y7_Y7_Y7_Y7" 
              class="w-full rounded-2xl shadow-inner" 
              alt="Resume Preview"
              referrerPolicy="no-referrer"
              @error="handleImageError"
            />
            <div class="absolute -bottom-10 -right-10 bg-surface-container-lowest p-6 rounded-2xl shadow-2xl border border-outline-variant/10 hidden md:block animate-bounce-slow">
              <div class="flex items-center gap-4">
                <div>
                  <p class="text-sm font-black text-on-surface">AI 优化建议</p>
                  <p class="text-xs text-on-surface-variant">内容得分提升了 45%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-32 px-6 bg-surface-container-lowest">
      <div class="max-w-7xl mx-auto space-y-20">
        <div class="text-center space-y-6 max-w-3xl mx-auto">
          <h2 class="text-4xl lg:text-6xl font-black text-on-surface tracking-tighter font-headline leading-tight">
            专为现代求职者设计的<br />
            <span class="text-primary italic">全方位工具</span>
          </h2>
          <p class="text-lg text-on-surface-variant font-body leading-relaxed">
            我们不仅提供模板，更提供一套完整的职业提升方案。从内容优化到视觉呈现，每一步都为您精心打造。
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon="dashboard_customize" 
            title="现代简历模板" 
            description="由顶级设计师打造，符合现代审美与 ATS 扫描系统，让您的简历在第一眼就脱颖而出。"
          />
          <FeatureCard 
            icon="edit_note" 
            title="直观编辑器" 
            description="所见即所得的编辑体验，无需排版烦恼。模块化设计，轻松调整简历结构。"
          />
          <FeatureCard 
            icon="link" 
            title="自定义链接发布" 
            description="一键生成专属在线简历链接，支持密码保护，随时随地分享您的职业成就。"
          />
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-32 px-6 bg-surface">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div class="space-y-12 order-2 lg:order-1">
          <div class="space-y-4">
            <h2 class="text-4xl font-black text-on-surface tracking-tighter font-headline">三步开启您的职业新篇章</h2>
            <p class="text-on-surface-variant">简单、高效、专业。我们简化了复杂的简历制作流程。</p>
          </div>

          <div class="space-y-8">
            <StepItem number="01" title="选择心仪模板" description="从我们丰富的模板库中选择最适合您行业和个性的设计。" />
            <StepItem number="02" title="填充职业内容" description="使用我们的智能编辑器，在 AI 的辅助下完善您的工作经历和技能。" />
            <StepItem number="03" title="一键发布分享" description="下载 PDF 或生成在线链接，开始投递您的理想职位。" />
          </div>
        </div>
        
        <div class="order-1 lg:order-2">
          <div class="relative aspect-square rounded-3xl bg-surface-container-high overflow-hidden shadow-2xl border border-outline-variant/10">
            <img :src="home2Img" class="w-full h-full object-cover opacity-80" alt="Process illustration" referrerPolicy="no-referrer" />
            <div class="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-32 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="cta-gradient rounded-[40px] p-12 lg:p-24 text-center space-y-10 shadow-2xl shadow-primary/30 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div class="relative z-10 space-y-6">
            <h2 class="text-4xl lg:text-7xl font-black text-on-primary tracking-tighter font-headline leading-none">
              准备好获得您的<br />下一份理想工作了吗？
            </h2>
            <p class="text-xl text-on-primary/80 max-w-2xl mx-auto font-body">
              加入策展简历，与数万名职场精英一起，用更专业的方式展示您的价值。
            </p>
            <div class="pt-6">
              <router-link to="/editor" class="bg-surface-container-lowest text-primary px-12 py-6 rounded-2xl font-headline font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all inline-block">
                立即免费开始
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import home1Img from '@/assets/images/home1.jpg';
import home2Img from '@/assets/images/home2.jpg';

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = home1Img;
};

const FeatureCard = defineComponent({
  props: ['icon', 'title', 'description'],
  template: `
    <div class="bg-surface-container-low p-10 rounded-[32px] border border-outline-variant/10 hover:border-primary/20 hover:bg-surface-container-high transition-all group">
      <div class="w-16 h-16 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform shadow-sm">
        <span class="material-symbols-outlined text-4xl">{{ icon }}</span>
      </div>
      <h3 class="text-xl font-black text-on-surface mb-4 font-headline tracking-tight">{{ title }}</h3>
      <p class="text-on-surface-variant leading-relaxed font-body text-sm">{{ description }}</p>
    </div>
  `
});

const StepItem = defineComponent({
  props: ['number', 'title', 'description'],
  template: `
    <div class="flex gap-8 group">
      <div class="text-4xl font-black text-primary/20 group-hover:text-primary transition-colors font-headline leading-none">{{ number }}</div>
      <div class="space-y-2">
        <h3 class="text-xl font-black text-on-surface font-headline tracking-tight">{{ title }}</h3>
        <p class="text-on-surface-variant leading-relaxed font-body text-sm">{{ description }}</p>
      </div>
    </div>
  `
});
</script>

<style scoped>
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}
</style>
