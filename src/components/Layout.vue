<template>
  <div class="min-h-screen flex flex-col bg-surface">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <router-link to="/" class="text-3xl font-black text-on-surface tracking-tighter font-headline">
            策展简历
          </router-link>
          
          <nav class="hidden md:flex items-center gap-8">
            <router-link to="/" class="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">首页</router-link>
            <!-- <a href="#features" class="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">功能</a> -->
            <router-link to="/templates" class="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">模板</router-link>
            <router-link to="/contact" class="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">联系我们</router-link>
            <button
              type="button"
              class="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
              @click="showFeedback = true"
            >提意见</button>
            <!-- <a href="#pricing" class="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">价格</a> -->
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="authStore.isLoggedIn">
            <router-link
              :to="{ name: 'MyPublishedResumes' }"
              class="text-xs sm:text-sm font-bold text-on-surface-variant hover:text-primary transition-colors max-w-[140px] sm:max-w-[200px] truncate inline-block align-middle"
              :title="`${authStore.user?.email} — 我的在线简历`"
            >
              {{ authStore.user?.email }}
            </router-link>
            <button
              type="button"
              class="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
              @click="authStore.logout()"
            >退出</button>
          </template>
          <button
            v-else
            type="button"
            class="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
            @click="showAuthModal = true"
          >登录</button>
          <router-link to="/editor" class="cta-gradient text-on-primary px-8 py-3 rounded-2xl font-headline font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all">
            立即开始
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-surface-container-lowest border-t border-outline-variant/10 py-20">
      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div class="col-span-1 md:col-span-1 space-y-6">
          <h2 class="text-2xl font-black text-on-surface tracking-tighter font-headline">策展简历</h2>
          <p class="text-sm text-on-surface-variant leading-relaxed">
            提升您的职场履历，成就非凡未来。几分钟内完成精美简历的构建、编辑与发布。
          </p>
          <div class="flex gap-4">
            <a href="#" class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all">
              <span class="material-symbols-outlined text-xl">share</span>
            </a>
            <a href="#" class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all">
              <span class="material-symbols-outlined text-xl">language</span>
            </a>
          </div>
        </div>

        <div class="space-y-6">
          <h3 class="text-sm font-bold uppercase tracking-widest text-outline">产品</h3>
          <ul class="space-y-4">
            <li><router-link to="/templates" class="text-sm text-on-surface-variant hover:text-primary transition-colors">简历模板</router-link></li>
            <li>
              <button
                type="button"
                class="text-sm text-on-surface-variant hover:text-primary transition-colors text-left"
                @click="showFeedback = true"
              >提意见</button>
            </li>
          </ul>
        </div>

        <div class="space-y-6">
          <h3 class="text-sm font-bold uppercase tracking-widest text-outline">公司</h3>
          <ul class="space-y-4">
            <li><router-link to="/contact" class="text-sm text-on-surface-variant hover:text-primary transition-colors">联系我们</router-link></li>
          </ul>
        </div>

        <div class="space-y-6">
          <h3 class="text-sm font-bold uppercase tracking-widest text-outline">法律</h3>
          <ul class="space-y-4">
            <li><a href="#" class="text-sm text-on-surface-variant hover:text-primary transition-colors">隐私政策</a></li>
            <li><a href="#" class="text-sm text-on-surface-variant hover:text-primary transition-colors">服务条款</a></li>
            <li><a href="#" class="text-sm text-on-surface-variant hover:text-primary transition-colors">Cookie 政策</a></li>
          </ul>
        </div>
      </div>
      
      <div class="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-xs text-outline">© 2026 策展简历. 保留所有权利。</p>
        <!-- <div class="flex gap-8">
          <a href="#" class="text-xs text-outline hover:text-primary transition-colors">简体中文</a>
          <a href="#" class="text-xs text-outline hover:text-primary transition-colors">English</a>
        </div> -->
      </div>
    </footer>

    <FeedbackModal v-model="showFeedback" />
    <AuthModal v-model="showAuthModal" @success="onAuthSuccess" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AuthModal from '@/components/AuthModal.vue';
import FeedbackModal from '@/components/FeedbackModal.vue';

const authStore = useAuthStore();
const showFeedback = ref(false);
const showAuthModal = ref(false);

async function onAuthSuccess() {
  await authStore.fetchMe();
}

onMounted(() => {
  void authStore.fetchMe();
});
</script>
