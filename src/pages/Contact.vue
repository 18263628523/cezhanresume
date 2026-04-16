<template>
  <div class="bg-surface min-h-screen pt-28 pb-24 px-6">
    <div class="max-w-5xl mx-auto space-y-10">
      <header class="text-center space-y-4 max-w-3xl mx-auto">
        <h1 class="text-5xl lg:text-6xl font-black text-on-surface tracking-tighter font-headline leading-tight">
          联系我们
        </h1>
        <p class="text-lg text-on-surface-variant font-body leading-relaxed">
          有功能建议、合作需求或使用问题，欢迎随时联系我们。
        </p>
      </header>

      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/15 space-y-6">
          <h2 class="text-xl font-black text-on-surface font-headline tracking-tight">联系方式</h2>
          <ul class="space-y-4 text-sm text-on-surface-variant">
            <li class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary">mail</span>
              <span>3431250469@qq.com</span>
            </li>
            <li class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary">call</span>
              <span>+86 18263628523</span>
            </li>
            <li class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary">schedule</span>
              <span>工作日 09:30 - 18:30</span>
            </li>
          </ul>
        </div>

        <div class="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/15 space-y-5">
          <h2 class="text-xl font-black text-on-surface font-headline tracking-tight">留言咨询</h2>
          <div class="space-y-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">姓名</label>
            <input type="text" class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none" placeholder="请输入您的姓名" />
          </div>
          <div class="space-y-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">邮箱</label>
            <input type="email" class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none" placeholder="请输入您的邮箱" />
          </div>
          <div class="space-y-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">留言内容</label>
            <textarea rows="5" class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none resize-none" placeholder="请输入您想咨询的问题"></textarea>
          </div>
          <button type="button" class="cta-gradient text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-sm shadow-lg active:scale-95 transition-all">
            提交留言
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
