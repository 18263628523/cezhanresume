<template>
  <div class="h-screen flex flex-col bg-surface overflow-hidden">
    <header class="bg-surface-container-lowest border-b border-outline-variant/15 px-8 py-3 flex justify-between items-center z-50">
      <div class="flex items-center gap-8">
        <router-link to="/" class="flex items-center gap-2">
          <img :src="logoImg" alt="策展简历" class="w-7 h-7 rounded-md" />
          <span class="text-2xl font-black text-on-surface tracking-tighter font-headline">策展简历</span>
        </router-link>
        <div class="h-4 w-px bg-outline-variant/30"></div>
        <div ref="templateMenuRoot" class="flex items-center gap-3 relative z-[60]">
          <span class="text-xs font-label uppercase tracking-widest text-outline">模板</span>
          <button
            type="button"
            class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg text-sm font-semibold text-primary min-w-[10rem] justify-between"
            @click.stop="templateMenuOpen = !templateMenuOpen"
          >
            {{ activeTemplate.name }}
            <span class="material-symbols-outlined text-sm">{{
              templateMenuOpen ? 'expand_less' : 'expand_more'
            }}</span>
          </button>
          <div
            v-show="templateMenuOpen"
            class="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[min(70vh,22rem)] overflow-y-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl py-2 z-[70]"
            @click.stop
          >
            <button
              v-for="t in resumeTemplatePresets"
              :key="t.id"
              type="button"
              class="w-full text-left px-4 py-3 hover:bg-surface-container-high transition-colors flex gap-3"
              :class="activeTemplateId === t.id ? 'bg-primary/10' : ''"
              @click="applyResumeTemplate(t.id)"
            >
              <span class="w-3 h-3 rounded-full shrink-0 mt-1 ring-2 ring-white shadow-sm" :style="{ backgroundColor: t.accent }" />
              <span class="min-w-0">
                <span class="block font-bold text-sm text-on-surface">{{ t.name }}</span>
                <span class="block text-xs text-on-surface-variant mt-0.5 leading-snug">{{ t.blurb }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <!-- 已登录：显示邮箱 + 退出 -->
        <template v-if="authStore.isLoggedIn">
          <router-link
            :to="{ name: 'MyPublishedResumes' }"
            class="text-xs text-on-surface-variant hover:text-primary max-w-[120px] sm:max-w-[160px] truncate transition-colors"
            :title="`${authStore.user?.email} — 我的在线简历`"
          >
            {{ authStore.user?.email }}
          </router-link>
          <button
            type="button"
            class="text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-container-high"
            @click="authStore.logout()"
          >退出</button>
          <div class="h-4 w-px bg-outline-variant/30"></div>
        </template>
        <button
          v-else
          type="button"
          class="text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-container-high"
          @click="showAuthModal = true"
        >登录</button>

        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary px-3 py-2 rounded-xl hover:bg-surface-container-high transition-all"
          title="提意见"
          @click="showFeedbackModal = true"
        >
          <span class="material-symbols-outlined text-base">feedback</span>
          提意见
        </button>
        <button
          type="button"
          class="bg-surface-container-high text-on-surface px-5 py-2 rounded-xl font-headline font-bold text-sm hover:bg-surface-container-low transition-all"
          @click="exportPdf"
        >
          导出 PDF
        </button>
        <button
          type="button"
          class="cta-gradient text-on-primary px-6 py-2 rounded-xl font-headline font-bold text-sm shadow-lg active:scale-95 transition-all"
          @click="onClickPublish"
        >
          上传在线网页
        </button>
      </div>
    </header>

    <!-- 登录/注册弹窗 -->
    <AuthModal v-model="showAuthModal" @success="onAuthSuccess" />
    <FeedbackModal v-model="showFeedbackModal" />

    <!-- 发布弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showPublishDialog"
          class="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm px-4"
          @click.self="closePublishDialog"
        >
          <div class="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div class="space-y-1">
              <h2 class="text-xl font-black text-on-surface font-headline">发布在线简历</h2>
              <p class="text-sm text-on-surface-variant">发布后任何人都可以通过链接访问。</p>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-outline">自定义链接后缀（可选）</label>
              <div class="flex items-center gap-2">
                <span class="text-sm text-on-surface-variant shrink-0">/r/</span>
                <input
                  v-model="publishSlug"
                  type="text"
                  placeholder="留空自动生成，如 zhangsan"
                  maxlength="32"
                  :disabled="publishing"
                  :class="[
                    'flex-1 bg-surface-container-low border-none rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none transition-all disabled:opacity-50',
                    slugInputConflict
                      ? 'ring-2 ring-red-400 focus:ring-red-400'
                      : 'ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary-fixed'
                  ]"
                  @input="slugInputConflict = false"
                />
              </div>
              <p v-if="slugInputConflict" class="text-xs text-red-500 font-medium">该后缀已被占用，请换一个</p>
              <p v-else class="text-xs text-on-surface-variant">只能用小写字母、数字和连字符，2-32 位。</p>
            </div>

            <div v-if="publishedUrl" class="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <p class="text-xs font-bold text-primary uppercase tracking-widest">已发布</p>
              <a :href="publishedUrl" target="_blank" class="text-sm text-primary break-all hover:underline">{{ publishedUrl }}</a>
              <button
                type="button"
                class="text-xs text-on-surface-variant hover:text-primary transition-colors"
                @click="copyUrl"
              >复制链接</button>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="flex-1 bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all"
                :disabled="publishing"
                @click="closePublishDialog"
              >关闭</button>
              <button
                type="button"
                class="flex-1 cta-gradient text-on-primary px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
                :disabled="publishing"
                @click="publishToWeb"
              >{{ publishing ? '发布中…' : '确认发布' }}</button>
            </div>
          </div>
          <button
            type="button"
            class="opacity-70 hover:opacity-100 transition-opacity active:scale-90"
            aria-label="关闭发布弹窗"
            @click="closePublishDialog"
          >
            <img src="@/assets/images/Close.png" alt="" class="w-10 h-10" />
          </button>
        </div>
      </Transition>
    </Teleport>

    <main class="flex-1 flex overflow-hidden">
      <aside class="w-64 bg-surface-container-low flex flex-col p-6 space-y-8 overflow-y-auto no-scrollbar shrink-0">
        <div class="space-y-1">
          <p class="text-[10px] uppercase tracking-[0.2em] font-bold text-outline mb-4 px-4">内容板块</p>
          <nav class="space-y-1">
            <EditorSidebarItem
              icon="person"
              label="个人信息"
              :active="activeSection === 'info'"
              @click="activeSection = 'info'"
            />
            <EditorSidebarItem
              icon="work"
              label="工作经历"
              :active="activeSection === 'work'"
              @click="activeSection = 'work'"
            />
            <EditorSidebarItem
              icon="school"
              label="教育背景"
              :active="activeSection === 'edu'"
              @click="activeSection = 'edu'"
            />
            <EditorSidebarItem
              icon="psychology"
              label="专业技能"
              :active="activeSection === 'skills'"
              @click="activeSection = 'skills'"
            />
            <EditorSidebarItem
              icon="folder_special"
              label="项目经验"
              :active="activeSection === 'projects'"
              @click="activeSection = 'projects'"
            />
            <EditorSidebarItem icon="add_circle" label="自定义板块" disabled />
          </nav>
        </div>
        <div class="space-y-1 pt-6 border-t border-outline-variant/20">
          <p class="text-[10px] uppercase tracking-[0.2em] font-bold text-outline mb-4 px-4">外观设置</p>
          <EditorSidebarItem
            icon="palette"
            label="设计与样式"
            :active="activeSection === 'appearance'"
            @click="activeSection = 'appearance'"
          />
        </div>
        <div class="mt-auto pt-8">
          <div class="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <p class="text-xs font-bold text-primary mb-1">简历得分: 85%</p>
            <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mb-3">
              <div class="bg-primary h-full w-[85%]"></div>
            </div>
            <button
              type="button"
              class="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider"
            >
              立即优化 <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>
      </aside>

      <section class="flex-1 bg-surface overflow-y-auto no-scrollbar p-10 max-w-3xl mx-auto w-full min-w-0">
        <div class="space-y-12">
          <header>
            <h1 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">
              {{ sectionMeta[activeSection].title }}
            </h1>
            <p class="text-on-surface-variant font-body">{{ sectionMeta[activeSection].desc }}</p>
          </header>

          <Transition name="section-tab" mode="out-in">
          <div v-if="activeSection === 'appearance'" key="appearance" class="space-y-8">
            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-5">
              <h2 class="text-xs font-bold uppercase tracking-wider text-outline">简历模板</h2>
              <p class="text-sm text-on-surface-variant">一键切换配色、字号、密度与预览版式；与顶部「模板」菜单同步。</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  v-for="t in resumeTemplatePresets"
                  :key="t.id"
                  type="button"
                  class="rounded-xl border p-4 text-left transition-all flex gap-3 items-start"
                  :class="
                    activeTemplateId === t.id
                      ? 'border-primary bg-primary/8 ring-2 ring-primary/20'
                      : 'border-outline-variant/25 hover:border-primary/35 bg-surface-container-low'
                  "
                  @click="applyResumeTemplate(t.id)"
                >
                  <span
                    class="w-10 h-10 rounded-lg shrink-0 shadow-inner"
                    :style="{
                      background: `linear-gradient(135deg, ${t.accent}, ${withAlpha(t.accent, 0.55)})`,
                    }"
                  />
                  <span class="min-w-0">
                    <span class="block font-headline font-bold text-on-surface text-sm">{{ t.name }}</span>
                    <span class="block text-xs text-on-surface-variant mt-1 leading-relaxed">{{ t.blurb }}</span>
                  </span>
                </button>
              </div>
            </div>

            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-5">
              <h2 class="text-xs font-bold uppercase tracking-wider text-outline">主题色</h2>
              <p class="text-sm text-on-surface-variant">用于预览区标题下划线、强调文字与职位行高亮。</p>
              <div class="flex flex-wrap gap-3 items-center">
                <button
                  v-for="opt in accentOptions"
                  :key="opt.id"
                  type="button"
                  class="relative w-11 h-11 rounded-full shadow-sm ring-2 ring-offset-2 ring-offset-surface-container-lowest transition-all focus:outline-none focus-visible:ring-primary-fixed"
                  :class="appearance.accent === opt.color ? 'ring-primary scale-105' : 'ring-transparent hover:ring-outline-variant/40'"
                  :style="{ backgroundColor: opt.color }"
                  :title="opt.label"
                  :aria-label="`主题色 ${opt.label}`"
                  @click="appearance.accent = opt.color"
                >
                  <span
                    v-if="appearance.accent === opt.color"
                    class="material-symbols-outlined absolute inset-0 m-auto text-white text-xl drop-shadow-sm pointer-events-none"
                  >check</span>
                </button>

                <!-- 自定义颜色选择器 -->
                <label
                  class="relative w-11 h-11 rounded-full shadow-sm ring-2 ring-offset-2 ring-offset-surface-container-lowest cursor-pointer transition-all overflow-hidden"
                  :class="isCustomAccent ? 'ring-primary scale-105' : 'ring-transparent hover:ring-outline-variant/40'"
                  :style="{ background: `conic-gradient(from 0deg, #f44336, #ff9800, #ffeb3b, #4caf50, #2196f3, #9c27b0, #f44336)` }"
                  title="自定义颜色"
                >
                  <input
                    type="color"
                    :value="appearance.accent"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    @input="onCustomAccent"
                  />
                  <span
                    v-if="isCustomAccent"
                    class="material-symbols-outlined absolute inset-0 m-auto text-white text-xl drop-shadow-sm pointer-events-none"
                  >check</span>
                </label>
              </div>
              <p v-if="isCustomAccent" class="text-xs text-on-surface-variant">
                当前自定义色：<span class="inline-block w-3 h-3 rounded-full align-middle mr-1" :style="{ backgroundColor: appearance.accent }"></span>
                <code class="text-on-surface font-mono">{{ appearance.accent }}</code>
              </p>
            </div>

            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-5">
              <h2 class="text-xs font-bold uppercase tracking-wider text-outline">正文字号</h2>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in fontScaleOptions"
                  :key="opt.id"
                  type="button"
                  class="py-3 rounded-xl text-sm font-bold border transition-all"
                  :class="
                    appearance.fontScale === opt.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
                  "
                  @click="appearance.fontScale = opt.id"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-5">
              <h2 class="text-xs font-bold uppercase tracking-wider text-outline">版面密度</h2>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in densityOptions"
                  :key="opt.id"
                  type="button"
                  class="py-3 rounded-xl text-sm font-bold border transition-all"
                  :class="
                    appearance.density === opt.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
                  "
                  @click="appearance.density = opt.id"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-5">
              <h2 class="text-xs font-bold uppercase tracking-wider text-outline">标题字体</h2>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  v-for="opt in headlineFontOptions"
                  :key="opt.id"
                  type="button"
                  class="py-3 px-4 rounded-xl text-sm font-bold border text-left transition-all"
                  :class="
                    appearance.headlineFont === opt.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
                  "
                  @click="appearance.headlineFont = opt.id"
                >
                  <span :class="[opt.previewClass, 'font-bold block text-base text-on-surface mb-0.5']">{{ opt.sample }}</span>
                  <span class="text-xs font-normal text-on-surface-variant">{{ opt.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 个人信息 -->
          <div v-else-if="activeSection === 'info'" key="info" class="space-y-8">
            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-6">
              <div class="flex flex-col sm:flex-row gap-6 items-start pb-6 border-b border-outline-variant/15">
                <div class="flex flex-col items-center gap-3 shrink-0 mx-auto sm:mx-0">
                  <div
                    class="w-28 h-28 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-outline-variant/30 flex items-center justify-center"
                  >
                    <img
                      v-if="resume.avatar"
                      :src="resume.avatar"
                      alt="头像预览"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="material-symbols-outlined text-5xl text-outline">person</span>
                  </div>
                  <div class="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      class="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity"
                      @click="avatarFileRef?.click()"
                    >
                      上传图片
                    </button>
                    <button
                      v-if="resume.avatar"
                      type="button"
                      class="px-4 py-2 rounded-lg text-xs font-bold text-error hover:bg-error/5 transition-colors"
                      @click="clearAvatar"
                    >
                      移除
                    </button>
                  </div>
                  <input
                    ref="avatarFileRef"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    class="hidden"
                    @change="onAvatarFile"
                  />
                </div>
                <div class="flex-1 min-w-0 space-y-2 w-full">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">图片链接（可选）</label>
                  <input
                    :value="avatarLinkDisplay"
                    type="url"
                    inputmode="url"
                    autocomplete="off"
                    placeholder="https://example.com/photo.jpg"
                    class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                    @input="onAvatarLinkFromEvent"
                  />
                  <p class="text-xs text-on-surface-variant leading-relaxed">
                    支持 JPG、PNG、WebP、GIF，本地图片不超过 2MB。填写链接与上传二选一即可。
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-6">
                <EditorTextField v-model="resume.name" label="姓名" />
                <EditorTextField v-model="resume.title" label="求职意向 / 职位" />
                <EditorTextField v-model="resume.email" label="邮箱" type="email" />
                <EditorTextField v-model="resume.phone" label="电话" type="tel" />
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">省份/地区</label>
                  <el-select
                    v-model="selectedProvince"
                    placeholder="请选择省份"
                    class="edu-degree-select !w-full"
                    popper-class="edu-degree-popper"
                    filterable
                    @change="onProvinceChange"
                  >
                    <el-option
                      v-for="p in provinceList"
                      :key="p.id"
                      :label="p.name"
                      :value="p.id"
                    />
                  </el-select>
                </div>
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">城市</label>
                  <el-select
                    v-model="resume.location"
                    placeholder="请选择城市"
                    class="edu-degree-select !w-full"
                    popper-class="edu-degree-popper"
                    filterable
                    allow-create
                    default-first-option
                  >
                    <el-option
                      v-for="c in cityList"
                      :key="c"
                      :label="c"
                      :value="c"
                    />
                  </el-select>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">个人总结</label>
                <textarea
                  v-model="resume.summary"
                  rows="5"
                  class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <!-- 工作经历 -->
          <div v-else-if="activeSection === 'work'" key="work" class="space-y-6">
            <Transition name="work-switch" mode="out-in">
              <div :key="activeWorkId">
                <template v-for="w in sortedWorkEntries" :key="w.id">
                  <div v-if="w.id === activeWorkId" class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-6">
                <div class="grid grid-cols-2 gap-6">
                  <EditorTextField v-model="w.position" label="职位名称" />
                  <EditorTextField v-model="w.company" label="公司名称" />
                  <div class="space-y-2">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">开始日期</label>
                    <div class="flex gap-2">
                      <el-select
                        :model-value="splitYear(w.start)"
                        placeholder="年"
                        class="edu-degree-select !w-full"
                        popper-class="edu-degree-popper"
                        filterable
                        @update:model-value="(y: string) => w.start = joinYM(y, splitMonth(w.start))"
                      >
                        <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
                      </el-select>
                      <el-select
                        :model-value="splitMonth(w.start)"
                        placeholder="月"
                        class="edu-degree-select !w-full"
                        popper-class="edu-degree-popper"
                        @update:model-value="(m: string) => w.start = joinYM(splitYear(w.start), m)"
                      >
                        <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
                      </el-select>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">结束日期</label>
                    <div class="flex gap-2">
                      <el-select
                        :model-value="splitYear(w.end)"
                        placeholder="年"
                        class="edu-degree-select !w-full"
                        popper-class="edu-degree-popper"
                        filterable
                        clearable
                        @update:model-value="(y: string) => w.end = joinYM(y, splitMonth(w.end))"
                      >
                        <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
                      </el-select>
                      <el-select
                        :model-value="splitMonth(w.end)"
                        placeholder="月"
                        class="edu-degree-select !w-full"
                        popper-class="edu-degree-popper"
                        clearable
                        @update:model-value="(m: string) => w.end = joinYM(splitYear(w.end), m)"
                      >
                        <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
                      </el-select>
                    </div>
                    <p class="text-[10px] text-on-surface-variant ml-1">留空表示至今</p>
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">工作描述</label>
                  <textarea
                    v-model="w.description"
                    rows="5"
                    placeholder="每条要点单独一行，预览将显示为列表"
                    class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none resize-none placeholder:text-on-surface-variant/50"
                  />
                </div>
                <div class="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    class="text-error font-bold text-xs flex items-center gap-1 hover:bg-error/5 px-3 py-2 rounded-lg transition-all"
                    @click="removeWork(w.id)"
                  >
                    删除
                  </button>
                </div>
              </div>
                </template>
              </div>
            </Transition>

            <button
              v-for="w in sortedWorkEntries.filter((x) => x.id !== activeWorkId)"
              :key="w.id"
              type="button"
              class="w-full text-left bg-surface-container-lowest rounded-xl px-8 py-4 border border-outline-variant/10 flex justify-between items-center group cursor-pointer hover:bg-surface-container-low transition-all"
              @click="activeWorkId = w.id"
            >
              <div class="flex items-center gap-4">
                <!-- <span class="material-symbols-outlined text-outline">drag_indicator</span> -->
                <div>
                  <p class="font-headline font-bold text-on-surface">{{ w.position || '未填写职位' }}</p>
                  <p class="text-xs text-on-surface-variant">
                    {{ w.company || '未填写公司' }} · {{ formatMonthLabel(w.start) }} — {{ formatMonthLabel(w.end, true) }}
                  </p>
                </div>
              </div>
              <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">编辑</span>
            </button>

            <button
              type="button"
              class="w-full py-6 border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              @click="addWork"
            >
              <div
                class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors"
              >
                <span class="material-symbols-outlined text-primary">add</span>
              </div>
              <span class="font-headline font-bold text-sm text-on-surface-variant group-hover:text-primary transition-colors">添加工作经历</span>
            </button>
          </div>

          <!-- 教育背景 -->
          <div v-else-if="activeSection === 'edu'" key="edu" class="space-y-6">
            <div
              v-for="e in resume.education"
              :key="e.id"
              class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-6"
            >
              <div class="grid grid-cols-2 gap-6">
                <EditorTextField v-model="e.school" label="学校名称" />
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">学历</label>
                  <el-select
                    v-model="e.degree"
                    placeholder="请选择学历"
                    class="edu-degree-select !w-full"
                    popper-class="edu-degree-popper"
                  >
                    <el-option
                      v-for="opt in degreeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">专业</label>
                  <el-select
                    v-model="e.major"
                    placeholder="请选择专业"
                    class="edu-degree-select !w-full"
                    popper-class="edu-degree-popper"
                    filterable
                    allow-create
                    default-first-option
                  >
                    <el-option
                      v-for="opt in majorOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">入学时间</label>
                  <div class="flex gap-2">
                    <el-select
                      :model-value="splitYear(e.start)"
                      placeholder="年"
                      class="edu-degree-select !w-full"
                      popper-class="edu-degree-popper"
                      filterable
                      @update:model-value="(y: string) => e.start = joinYM(y, splitMonth(e.start))"
                    >
                      <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
                    </el-select>
                    <el-select
                      :model-value="splitMonth(e.start)"
                      placeholder="月"
                      class="edu-degree-select !w-full"
                      popper-class="edu-degree-popper"
                      @update:model-value="(m: string) => e.start = joinYM(splitYear(e.start), m)"
                    >
                      <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
                    </el-select>
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">毕业时间</label>
                  <div class="flex gap-2">
                    <el-select
                      :model-value="splitYear(e.end)"
                      placeholder="年"
                      class="edu-degree-select !w-full"
                      popper-class="edu-degree-popper"
                      filterable
                      clearable
                      @update:model-value="(y: string) => e.end = joinYM(y, splitMonth(e.end))"
                    >
                      <el-option v-for="y in yearOptionsEdu" :key="y" :label="y + '年'" :value="y" />
                    </el-select>
                    <el-select
                      :model-value="splitMonth(e.end)"
                      placeholder="月"
                      class="edu-degree-select !w-full"
                      popper-class="edu-degree-popper"
                      clearable
                      @update:model-value="(m: string) => e.end = joinYM(splitYear(e.end), m)"
                    >
                      <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
                    </el-select>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="w-full py-4 border-2 border-dashed border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all"
              @click="addEducation"
            >
              + 添加教育经历
            </button>
          </div>

          <!-- 专业技能 -->
          <div v-else-if="activeSection === 'skills'" key="skills" class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">技能列表</label>
            <textarea
              v-model="resume.skills"
              rows="12"
              placeholder="每行一项技能"
              class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none resize-none font-body text-sm placeholder:text-on-surface-variant/50"
            />
          </div>

          <!-- 项目经验 -->
          <div v-else-if="activeSection === 'projects'" key="projects" class="space-y-6">
            <div
              v-for="p in resume.projects"
              :key="p.id"
              class="bg-surface-container-lowest rounded-xl p-8 shadow-sm space-y-6"
            >
              <EditorTextField v-model="p.name" label="项目名称" />
              <EditorTextField v-model="p.role" label="您的角色" />
              <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase tracking-wider text-outline ml-1">项目描述</label>
                <textarea
                  v-model="p.detail"
                  rows="4"
                  class="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 rounded-lg p-3 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all outline-none resize-none"
                />
              </div>
            </div>
            <button
              type="button"
              class="w-full py-4 border-2 border-dashed border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all"
              @click="addProject"
            >
              + 添加项目
            </button>
          </div>
          </Transition>
        </div>
      </section>

      <section class="hidden lg:flex flex-col w-[500px] shrink-0 bg-surface-container-low p-8 border-l border-outline-variant/10 overflow-hidden">
        <div class="flex justify-between items-center mb-6">
          <span class="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">实时预览</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-2.5 py-1.5 min-w-[3rem] bg-surface-container-lowest rounded-lg shadow-sm text-xs font-bold text-on-surface-variant disabled:opacity-40 hover:text-primary transition-colors"
              :disabled="previewScale >= 1.25"
              @click="previewScale = Math.min(1.25, Math.round((previewScale + 0.1) * 100) / 100)"
            >
              放大
            </button>
            <button
              type="button"
              class="px-2.5 py-1.5 min-w-[3rem] bg-surface-container-lowest rounded-lg shadow-sm text-xs font-bold text-on-surface-variant disabled:opacity-40 hover:text-primary transition-colors"
              :disabled="previewScale <= 0.75"
              @click="previewScale = Math.max(0.75, Math.round((previewScale - 0.1) * 100) / 100)"
            >
              缩小
            </button>
            <button
              type="button"
              class="px-2.5 py-1.5 min-w-[3rem] bg-surface-container-lowest rounded-lg shadow-sm text-xs font-bold text-on-surface-variant opacity-50 pointer-events-none"
              title="即将支持"
            >
              全屏
            </button>
          </div>
        </div>

        <div
          class="flex-1 bg-white shadow-2xl rounded-sm overflow-y-auto no-scrollbar origin-top transition-transform duration-300"
          :style="{ transform: `scale(${previewScale})` }"
        >
          <!-- ═══ 左右结构布局 ═══ -->
          <div v-if="isSidebarLayout" class="min-h-[1100px] flex">
            <!-- 左栏：头像 + 联系方式 + 技能 + 教育 -->
            <div
              class="w-[28%] shrink-0 px-3 py-5 space-y-5"
              :style="{
                backgroundColor: isSidebarDark ? appearance.accent : '#f3f4f6',
                color: isSidebarDark ? '#f1f5f9' : '#374151',
              }"
            >
              <!-- 头像 -->
              <div v-if="resume.avatar" class="flex justify-center">
                <div class="w-24 h-24 rounded-full overflow-hidden border-3 shadow-md" :style="{ borderColor: isSidebarDark ? 'rgba(255,255,255,0.3)' : appearance.accent }">
                  <img :src="resume.avatar" alt="" class="w-full h-full object-cover" />
                </div>
              </div>

              <!-- 联系方式 -->
              <div class="space-y-3">
                <h2 class="text-[9px] font-bold uppercase tracking-[0.2em] pb-1 border-b" :style="{ borderColor: isSidebarDark ? 'rgba(255,255,255,0.2)' : '#d1d5db', color: isSidebarDark ? '#cbd5e1' : appearance.accent }">联系方式</h2>
                <div class="space-y-2.5 text-[8px]">
                  <div v-if="resume.email">
                    <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: isSidebarDark ? '#94a3b8' : appearance.accent }">
                      <span class="material-symbols-outlined text-[10px]">mail</span>
                      <span class="font-bold uppercase tracking-wider">邮箱</span>
                    </div>
                    <p class="break-all leading-snug">{{ resume.email }}</p>
                  </div>
                  <div v-if="resume.phone">
                    <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: isSidebarDark ? '#94a3b8' : appearance.accent }">
                      <span class="material-symbols-outlined text-[10px]">phone</span>
                      <span class="font-bold uppercase tracking-wider">电话</span>
                    </div>
                    <p class="leading-snug">{{ resume.phone }}</p>
                  </div>
                  <div v-if="resume.location">
                    <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: isSidebarDark ? '#94a3b8' : appearance.accent }">
                      <span class="material-symbols-outlined text-[10px]">location_on</span>
                      <span class="font-bold uppercase tracking-wider">地点</span>
                    </div>
                    <p class="leading-snug">{{ resume.location }}</p>
                  </div>
                </div>
              </div>

              <!-- 专业技能 -->
              <div v-if="skillLines.length" class="space-y-3">
                <h2 class="text-[9px] font-bold uppercase tracking-[0.2em] pb-1 border-b" :style="{ borderColor: isSidebarDark ? 'rgba(255,255,255,0.2)' : '#d1d5db', color: isSidebarDark ? '#cbd5e1' : appearance.accent }">专业技能</h2>
                <ul class="space-y-1.5 text-[9px]">
                  <li v-for="(s, i) in skillLines" :key="i" class="flex items-start gap-2">
                    <span class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" :style="{ backgroundColor: isSidebarDark ? '#94a3b8' : appearance.accent }"></span>
                    {{ s }}
                  </li>
                </ul>
              </div>

              <!-- 教育背景 -->
              <div v-if="resume.education.some((e) => e.school.trim())" class="space-y-3">
                <h2 class="text-[9px] font-bold uppercase tracking-[0.2em] pb-1 border-b" :style="{ borderColor: isSidebarDark ? 'rgba(255,255,255,0.2)' : '#d1d5db', color: isSidebarDark ? '#cbd5e1' : appearance.accent }">教育背景</h2>
                <div class="space-y-3 text-[9px]">
                  <div v-for="e in resume.education" :key="e.id">
                    <template v-if="e.school.trim()">
                      <p class="font-bold text-[10px]">{{ e.school }}</p>
                      <p v-if="e.degree || e.major" class="opacity-80">{{ [e.degree, e.major].filter(Boolean).join(' · ') }}</p>
                      <p class="opacity-60">{{ formatMonthLabel(e.start) }} — {{ formatMonthLabel(e.end, true) }}</p>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右栏：姓名 + 摘要 + 工作 + 项目 -->
            <div class="flex-1 p-8 space-y-6">
              <!-- 姓名与职位 -->
              <div class="pb-5 border-b-2" :style="{ borderColor: appearance.accent }">
                <h1 class="text-2xl font-extrabold text-[#191b23] tracking-tight" :class="previewHeadlineFontClass">{{ resume.name || '姓名' }}</h1>
                <p class="text-xs font-bold uppercase tracking-widest mt-1" :style="{ color: appearance.accent }">{{ resume.title || '求职意向' }}</p>
              </div>

              <!-- 个人总结 -->
              <section v-if="resume.summary.trim()" class="space-y-2">
                <h2 class="text-[9px] font-bold uppercase tracking-[0.15em]" :style="{ color: appearance.accent }">个人总结</h2>
                <p class="text-[10px] leading-relaxed text-gray-600 whitespace-pre-wrap">{{ resume.summary }}</p>
              </section>

              <!-- 工作经历 -->
              <section v-if="resume.work.length" class="space-y-3">
                <h2 class="text-[9px] font-bold uppercase tracking-[0.15em]" :style="{ color: appearance.accent }">工作经历</h2>
                <div class="space-y-4">
                  <div v-for="w in sortedWorkEntries" :key="w.id" class="space-y-1">
                    <div class="flex justify-between items-baseline gap-2">
                      <h3 class="font-bold text-xs" :class="previewHeadlineFontClass">{{ w.position || '职位' }}</h3>
                      <span class="text-[8px] font-bold text-gray-400 shrink-0">{{ formatMonthLabel(w.start) }} — {{ formatMonthLabel(w.end, true) }}</span>
                    </div>
                    <p class="text-[9px] font-bold italic" :style="{ color: appearance.accent }">{{ w.company }}</p>
                    <ul v-if="bulletsFromDescription(w.description).length" class="list-disc list-inside text-[9px] text-gray-600 leading-relaxed ml-1">
                      <li v-for="(line, li) in bulletsFromDescription(w.description)" :key="li">{{ line }}</li>
                    </ul>
                    <p v-else-if="w.description.trim()" class="text-[9px] text-gray-600 whitespace-pre-wrap leading-relaxed">{{ w.description }}</p>
                  </div>
                </div>
              </section>

              <!-- 项目经验 -->
              <section v-if="resume.projects.some((p) => p.name.trim())" class="space-y-3">
                <h2 class="text-[9px] font-bold uppercase tracking-[0.15em]" :style="{ color: appearance.accent }">项目经验</h2>
                <div class="space-y-3">
                  <div v-for="p in resume.projects" :key="p.id" class="space-y-1">
                    <template v-if="p.name.trim()">
                      <div class="flex justify-between items-baseline gap-2">
                        <h3 class="font-bold text-xs" :class="previewHeadlineFontClass">{{ p.name }}</h3>
                        <span v-if="p.role.trim()" class="text-[8px] font-bold shrink-0" :style="{ color: appearance.accent }">{{ p.role }}</span>
                      </div>
                      <p v-if="p.detail.trim()" class="text-[9px] text-gray-600 whitespace-pre-wrap leading-relaxed">{{ p.detail }}</p>
                    </template>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <!-- ═══ 常规单栏布局 ═══ -->
          <div v-else class="min-h-[1100px]" :class="[previewLayout.pad, previewLayout.mainStack]">
            <div class="flex" :class="[previewHeaderClasses, previewHeaderRowClass]" :style="previewHeaderBorderStyle">
              <div
                v-if="resume.avatar"
                class="shrink-0 rounded-full overflow-hidden border-2 shadow-sm bg-surface-container-high"
                :class="previewAvatarSizeClass"
                :style="{ borderColor: appearance.accent }"
              >
                <img :src="resume.avatar" alt="" class="w-full h-full object-cover" />
              </div>
              <div class="min-w-0 flex-1" :class="previewHeaderTextAlignClass">
                <h1
                  class="text-[#191b23] tracking-tighter mb-2"
                  :class="[previewType.h1, previewHeadlineFontClass, previewNameClass]"
                >
                  {{ resume.name || '姓名' }}
                </h1>
                <p
                  class="font-bold"
                  :class="[previewType.title, previewHeadlineFontClass, jobTitleTemplateClass]"
                  :style="{ color: appearance.accent }"
                >
                  {{ resume.title || '求职意向' }}
                </p>
                <div
                  class="mt-4 flex flex-wrap gap-4 text-on-surface-variant font-medium"
                  :class="[previewType.meta, previewMetaRowClass]"
                >
                  <span v-if="resume.email" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[1em]">mail</span> {{ resume.email }}
                  </span>
                  <span v-if="resume.phone" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[1em]">phone</span> {{ resume.phone }}
                  </span>
                  <span v-if="resume.location" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[1em]">location_on</span> {{ resume.location }}
                  </span>
                </div>
              </div>
            </div>

            <section v-if="resume.summary.trim()" :class="previewLayout.secTitleGap">
              <h2 :class="[previewType.h2, previewHeadlineFontClass, sectionHeadingClass]" :style="sectionHeadingStyle">
                个人总结
              </h2>
              <p
                class="leading-relaxed text-on-surface-variant whitespace-pre-wrap"
                :class="previewType.body"
              >
                {{ resume.summary }}
              </p>
            </section>

            <section v-if="resume.work.length" :class="previewLayout.workSec">
              <h2 :class="[previewType.h2, previewHeadlineFontClass, sectionHeadingClass]" :style="sectionHeadingStyle">
                工作经历
              </h2>
              <div
                :class="
                  isTimelineLayout
                    ? 'relative ml-2 pl-6 border-l-2 space-y-0'
                    : previewLayout.workList
                "
                :style="isTimelineLayout ? { borderLeftColor: withAlpha(appearance.accent, 0.35) } : undefined"
              >
                <div
                  v-for="w in sortedWorkEntries"
                  :key="w.id"
                  :class="isTimelineLayout ? 'relative pb-6 last:pb-0 space-y-1' : 'space-y-1'"
                >
                  <span
                    v-if="isTimelineLayout"
                    class="absolute -left-[1.95rem] top-1.5 h-3 w-3 rounded-full border-2 border-solid bg-white"
                    :style="{ borderColor: appearance.accent }"
                  />
                  <div class="flex justify-between items-baseline gap-2">
                    <h3 class="font-bold" :class="[previewType.h3, previewHeadlineFontClass]">
                      {{ w.position || '职位' }}
                    </h3>
                    <span class="font-bold text-outline shrink-0" :class="previewType.meta">{{ formatMonthLabel(w.start) }} — {{ formatMonthLabel(w.end, true) }}</span>
                  </div>
                  <p class="font-bold italic" :class="previewType.meta" :style="{ color: appearance.accent }">
                    {{ w.company }}
                  </p>
                  <ul
                    v-if="bulletsFromDescription(w.description).length"
                    class="list-disc list-inside leading-loose text-on-surface-variant ml-2"
                    :class="previewType.li"
                  >
                    <li v-for="(line, i) in bulletsFromDescription(w.description)" :key="i">{{ line }}</li>
                  </ul>
                  <p
                    v-else-if="w.description.trim()"
                    class="leading-loose text-on-surface-variant whitespace-pre-wrap"
                    :class="previewType.li"
                  >
                    {{ w.description }}
                  </p>
                </div>
              </div>
            </section>

            <section v-if="resume.education.some((e) => e.school.trim())" :class="previewLayout.eduSec">
              <h2 :class="[previewType.h2, previewHeadlineFontClass, sectionHeadingClass]" :style="sectionHeadingStyle">
                教育背景
              </h2>
              <div :class="previewLayout.eduList">
                <div v-for="e in resume.education" :key="e.id" class="space-y-1">
                  <template v-if="e.school.trim()">
                    <div class="flex justify-between items-baseline gap-2">
                      <h3 class="font-bold" :class="[previewType.h3, previewHeadlineFontClass]">{{ e.school }}</h3>
                      <span class="font-bold text-outline shrink-0" :class="previewType.meta">
                        {{ formatMonthLabel(e.start) }} — {{ formatMonthLabel(e.end, true) }}
                      </span>
                    </div>
                    <p v-if="e.degree.trim() || e.major.trim()" class="text-on-surface-variant" :class="previewType.meta">
                      {{ [e.degree, e.major].filter(Boolean).join(' · ') }}
                    </p>
                  </template>
                </div>
              </div>
            </section>

            <section v-if="skillLines.length" :class="previewLayout.skillSec">
              <h2 :class="[previewType.h2, previewHeadlineFontClass, sectionHeadingClass]" :style="sectionHeadingStyle">
                专业技能
              </h2>
              <ul
                class="list-disc list-inside leading-loose text-on-surface-variant ml-2 space-y-1"
                :class="previewType.li"
              >
                <li v-for="(s, i) in skillLines" :key="i">{{ s }}</li>
              </ul>
            </section>

            <section v-if="resume.projects.some((p) => p.name.trim())" :class="previewLayout.projSec">
              <h2 :class="[previewType.h2, previewHeadlineFontClass, sectionHeadingClass]" :style="sectionHeadingStyle">
                项目经验
              </h2>
              <div :class="previewLayout.projList">
                <div v-for="p in resume.projects" :key="p.id" class="space-y-1">
                  <template v-if="p.name.trim()">
                    <div class="flex justify-between items-baseline gap-2">
                      <h3 class="font-bold" :class="[previewType.h3, previewHeadlineFontClass]">{{ p.name }}</h3>
                      <span
                        v-if="p.role.trim()"
                        class="font-bold shrink-0"
                        :class="previewType.meta"
                        :style="{ color: appearance.accent }"
                      >{{ p.role }}</span>
                    </div>
                    <p
                      v-if="p.detail.trim()"
                      class="leading-relaxed text-on-surface-variant whitespace-pre-wrap"
                      :class="previewType.body"
                    >
                      {{ p.detail }}
                    </p>
                  </template>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import AuthModal from '@/components/AuthModal.vue';
import FeedbackModal from '@/components/FeedbackModal.vue';
import logoImg from '@/assets/images/cezhan.jpg';
import diquData from '@/assets/diqu.json';
import EditorSidebarItem from '@/components/editor/EditorSidebarItem.vue';
import EditorTextField from '@/components/editor/EditorTextField.vue';

type SectionKey = 'info' | 'work' | 'edu' | 'skills' | 'projects' | 'appearance';

type FontScaleId = 'sm' | 'md' | 'lg';
type DensityId = 'compact' | 'normal' | 'relaxed';
type HeadlineFontId = 'modern' | 'neutral' | 'classic';
type TemplateLayoutId =
  | 'modern'
  | 'minimal'
  | 'executive'
  | 'creative'
  | 'stripe'
  | 'magazine'
  | 'tech'
  | 'elegant'
  | 'timeline'
  | 'sidebar';

interface ResumeTemplatePreset {
  id: string;
  name: string;
  blurb: string;
  accent: string;
  fontScale: FontScaleId;
  density: DensityId;
  headlineFont: HeadlineFontId;
  layout: TemplateLayoutId;
}

function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface WorkEntry {
  id: string;
  position: string;
  company: string;
  start: string;
  end: string;
  description: string;
}

interface EduEntry {
  id: string;
  school: string;
  degree: string;
  major: string;
  start: string;
  end: string;
}

interface ProjectEntry {
  id: string;
  name: string;
  role: string;
  detail: string;
}

function newId() {
  return crypto.randomUUID();
}

const sectionMeta: Record<SectionKey, { title: string; desc: string }> = {
  info: {
    title: '个人信息',
    desc: '填写联系方式与求职意向，便于雇主联系您。',
  },
  work: {
    title: '工作经历',
    desc: '详细描述您的职业历程。请从最近的一份工作开始。',
  },
  edu: {
    title: '教育背景',
    desc: '添加您的学历与在校经历。',
  },
  skills: {
    title: '专业技能',
    desc: '列出您擅长的工具、语言与领域能力。',
  },
  projects: {
    title: '项目经验',
    desc: '展示代表性项目与成果。',
  },
  appearance: {
    title: '设计与样式',
    desc: '调整主题色、字号与排版密度，右侧预览会即时反映效果。',
  },
};

const accentOptions = [
  { id: 'blue', label: '蓝', color: '#004ac6' },
  { id: 'teal', label: '青', color: '#00796b' },
  { id: 'violet', label: '紫', color: '#5c2d91' },
  { id: 'green', label: '绿', color: '#1b5e20' },
  { id: 'rose', label: '玫', color: '#b71c4c' },
  { id: 'slate', label: '灰', color: '#37474f' },
] as const;

const fontScaleOptions: { id: FontScaleId; label: string }[] = [
  { id: 'sm', label: '小' },
  { id: 'md', label: '中' },
  { id: 'lg', label: '大' },
];

const densityOptions: { id: DensityId; label: string }[] = [
  { id: 'compact', label: '紧凑' },
  { id: 'normal', label: '标准' },
  { id: 'relaxed', label: '宽松' },
];

const headlineFontOptions: {
  id: HeadlineFontId;
  label: string;
  sample: string;
  previewClass: string;
}[] = [
  { id: 'modern', label: '现代（Manrope + 中文）', sample: 'Aa 简历标题', previewClass: 'font-headline' },
  { id: 'neutral', label: '简约（无衬线）', sample: 'Aa 简历标题', previewClass: 'font-body' },
  { id: 'classic', label: '经典（衬线）', sample: 'Aa 简历标题', previewClass: 'font-serif' },
];

const degreeOptions = [
  { label: '中专', value: '中专' },
  { label: '大专', value: '大专' },
  { label: '本科', value: '本科' },
  { label: '硕士', value: '硕士' },
  { label: '博士', value: '博士' },
  { label: '其他', value: '其他' },
];

const majorOptions = [
  { label: '计算机科学与技术', value: '计算机科学与技术' },
  { label: '软件工程', value: '软件工程' },
  { label: '信息管理与信息系统', value: '信息管理与信息系统' },
  { label: '电子信息工程', value: '电子信息工程' },
  { label: '通信工程', value: '通信工程' },
  { label: '自动化', value: '自动化' },
  { label: '人工智能', value: '人工智能' },
  { label: '数据科学与大数据技术', value: '数据科学与大数据技术' },
  { label: '产品设计', value: '产品设计' },
  { label: '视觉传达设计', value: '视觉传达设计' },
  { label: '交互设计', value: '交互设计' },
  { label: '市场营销', value: '市场营销' },
  { label: '工商管理', value: '工商管理' },
  { label: '人力资源管理', value: '人力资源管理' },
  { label: '金融学', value: '金融学' },
  { label: '会计学', value: '会计学' },
  { label: '法学', value: '法学' },
  { label: '英语', value: '英语' },
];

// ── 省市联动 ──────────────────────────────────────────────
const dq = diquData as Record<string, Record<string, string>>;
const provinces = dq['00'] ?? {};
const provinceList = Object.entries(provinces).map(([id, name]) => ({ id, name }));

const selectedProvince = ref('');

const cityList = computed(() => {
  if (!selectedProvince.value) return [];
  const cities = dq[selectedProvince.value];
  return cities ? Object.values(cities) : [];
});

function onProvinceChange() {
  resume.location = '';
}

const resumeTemplatePresets: ResumeTemplatePreset[] = [
  {
    id: 'compact',
    name: '精简专业',
    blurb: '默认小字号 + 紧凑版面，粗色条页眉，信息密度高。',
    accent: '#004ac6',
    fontScale: 'sm',
    density: 'compact',
    headlineFont: 'modern',
    layout: 'modern',
  },
  {
    id: 'modern',
    name: '现代专业版',
    blurb: '标准字号与留白，大标题，适合互联网与产品岗。',
    accent: '#004ac6',
    fontScale: 'md',
    density: 'normal',
    headlineFont: 'modern',
    layout: 'modern',
  },
  {
    id: 'minimal',
    name: '极简留白',
    blurb: '中性灰分割、左侧色条章节标题，偏文艺与留白。',
    accent: '#37474f',
    fontScale: 'md',
    density: 'relaxed',
    headlineFont: 'neutral',
    layout: 'minimal',
  },
  {
    id: 'executive',
    name: '经典商务',
    blurb: '衬线章节、双线条页眉，紧凑严谨，金融与咨询风。',
    accent: '#1a237e',
    fontScale: 'sm',
    density: 'compact',
    headlineFont: 'classic',
    layout: 'executive',
  },
  {
    id: 'creative',
    name: '创意设计',
    blurb: '标签式章节标题与厚底边，大字宽松，设计师向。',
    accent: '#7b1fa2',
    fontScale: 'lg',
    density: 'relaxed',
    headlineFont: 'modern',
    layout: 'creative',
  },
  {
    id: 'stripe',
    name: '侧边线谱',
    blurb: '左侧竖色条 + 细分割页眉，偏产品与运营汇报感。',
    accent: '#00796b',
    fontScale: 'sm',
    density: 'normal',
    headlineFont: 'neutral',
    layout: 'stripe',
  },
  {
    id: 'magazine',
    name: '杂志大片',
    blurb: '居中姓名区、细下划线章节，偏品牌与市场。',
    accent: '#c2185b',
    fontScale: 'lg',
    density: 'relaxed',
    headlineFont: 'modern',
    layout: 'magazine',
  },
  {
    id: 'tech',
    name: '极客工程',
    blurb: '等宽章节标题、利落双线页眉，开发与工程向。',
    accent: '#00838f',
    fontScale: 'sm',
    density: 'compact',
    headlineFont: 'neutral',
    layout: 'tech',
  },
  {
    id: 'elegant',
    name: '雅致书卷',
    blurb: '衬线斜体章节、淡色分割，偏学术与文化机构。',
    accent: '#5d4037',
    fontScale: 'md',
    density: 'normal',
    headlineFont: 'classic',
    layout: 'elegant',
  },
  {
    id: 'timeline',
    name: '职业时间轴',
    blurb: '纵向时间线展现关键经历，突出成长轨迹。',
    accent: '#6a1b9a',
    fontScale: 'sm',
    density: 'compact',
    headlineFont: 'modern',
    layout: 'timeline',
  },
  {
    id: 'sidebar-dark',
    name: '左栏深色',
    blurb: '左侧深色面板放头像与技能，右侧主体内容，双栏对比鲜明。',
    accent: '#1e3a5f',
    fontScale: 'sm',
    density: 'compact',
    headlineFont: 'modern',
    layout: 'sidebar',
  },
  {
    id: 'sidebar-light',
    name: '左栏浅色',
    blurb: '左侧浅灰面板，右侧白底内容区，简洁清爽的双栏布局。',
    accent: '#00796b',
    fontScale: 'md',
    density: 'normal',
    headlineFont: 'neutral',
    layout: 'sidebar',
  },
];

const activeTemplateId = ref('compact');
const activeTemplate = computed(
  () => resumeTemplatePresets.find((t) => t.id === activeTemplateId.value) ?? resumeTemplatePresets[0]!,
);

const isTimelineLayout = computed(() => activeTemplate.value.layout === 'timeline');
const isSidebarLayout = computed(() => activeTemplate.value.layout === 'sidebar');
const isSidebarDark = computed(() => activeTemplate.value.id === 'sidebar-dark');

const activeSection = ref<SectionKey>('work');
const activeWorkId = ref('');
const previewScale = ref(1);
const templateMenuOpen = ref(false);
const templateMenuRoot = ref<HTMLElement | null>(null);
const avatarFileRef = ref<HTMLInputElement | null>(null);

// ── 发布相关 ──────────────────────────────────────────────
const authStore = useAuthStore();
const showAuthModal = ref(false);
const showFeedbackModal = ref(false);

const showPublishDialog = ref(false);
const publishing = ref(false);
const publishSlug = ref('');
const publishedUrl = ref('');
const slugInputConflict = ref(false);
const route = useRoute();


function disableWorkEndDate(dateLike: any, start: string): boolean {
  const targetTs = toMonthStartTimestamp(dateLike);
  if (Number.isNaN(targetTs)) return false;
  if (disableAfterCurrentMonth(dateLike)) return true;
  const startTs = toMonthStartTimestamp(start);
  if (Number.isNaN(startTs)) return false;
  return targetTs < startTs;
}

function onDocumentClick(e: MouseEvent) {
  if (!templateMenuOpen.value) return;
  const el = templateMenuRoot.value;
  if (el && !el.contains(e.target as Node)) templateMenuOpen.value = false;
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  // 静默验证本地 token 是否仍有效
  if (authStore.token) authStore.fetchMe();
});
onUnmounted(() => document.removeEventListener('click', onDocumentClick));

const avatarLinkDisplay = computed(() => {
  const a = resume.avatar;
  return a.startsWith('http://') || a.startsWith('https://') ? a : '';
});

function onAvatarLinkInput(value: string) {
  const v = value.trim();
  if (!v) {
    if (resume.avatar.startsWith('data:')) return;
    resume.avatar = '';
    return;
  }
  resume.avatar = v;
}

function onAvatarLinkFromEvent(ev: Event) {
  const t = ev.target as HTMLInputElement | null;
  if (t) onAvatarLinkInput(t.value);
}

function onAvatarFile(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file?.type.startsWith('image/')) return;
  const max = 2 * 1024 * 1024;
  if (file.size > max) {
    window.alert('图片请小于 2MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') resume.avatar = reader.result;
  };
  reader.readAsDataURL(file);
}

function clearAvatar() {
  resume.avatar = '';
}

// ── 年+月下拉选项 ──
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 40 }, (_, i) => String(currentYear - i));
const yearOptionsEdu = Array.from({ length: 44 }, (_, i) => String(currentYear + 4 - i));
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `${i + 1}月`,
}));

function splitYear(val: string): string {
  return val?.match(/^(\d{4})/)?.[1] ?? '';
}
function splitMonth(val: string): string {
  return val?.match(/-(\d{2})$/)?.[1] ?? '';
}
function joinYM(y: string, m: string): string {
  if (!y) return '';
  if (!m) return `${y}-01`;
  return `${y}-${m}`;
}

const appearance = reactive({
  accent: accentOptions[0]!.color as string,
  fontScale: 'sm' as FontScaleId,
  density: 'compact' as DensityId,
  headlineFont: 'modern' as HeadlineFontId,
});

const presetColors = new Set<string>(accentOptions.map((o) => o.color));
const isCustomAccent = computed(() => !presetColors.has(appearance.accent));

function onCustomAccent(e: Event) {
  const input = e.target as HTMLInputElement;
  appearance.accent = input.value;
}

function applyResumeTemplate(id: string) {
  const t = resumeTemplatePresets.find((x) => x.id === id);
  if (!t) return;
  activeTemplateId.value = id;
  appearance.accent = t.accent;
  appearance.fontScale = t.fontScale;
  appearance.density = t.density;
  appearance.headlineFont = t.headlineFont;
  templateMenuOpen.value = false;
}

onMounted(() => {
  const templateId = typeof route.query.template === 'string' ? route.query.template : '';
  if (templateId) applyResumeTemplate(templateId);
});

const previewLayout = computed(() => {
  const d = appearance.density;
  if (d === 'compact') {
    return {
      pad: 'p-8',
      mainStack: 'space-y-5',
      secTitleGap: 'space-y-1.5',
      workSec: 'space-y-3',
      workList: 'space-y-4',
      eduSec: 'space-y-3',
      eduList: 'space-y-3',
      skillSec: 'space-y-1.5',
      projSec: 'space-y-3',
      projList: 'space-y-3',
    };
  }
  if (d === 'relaxed') {
    return {
      pad: 'p-14',
      mainStack: 'space-y-10',
      secTitleGap: 'space-y-3',
      workSec: 'space-y-5',
      workList: 'space-y-8',
      eduSec: 'space-y-5',
      eduList: 'space-y-5',
      skillSec: 'space-y-3',
      projSec: 'space-y-5',
      projList: 'space-y-5',
    };
  }
  return {
    pad: 'p-12',
    mainStack: 'space-y-8',
    secTitleGap: 'space-y-2',
    workSec: 'space-y-4',
    workList: 'space-y-6',
    eduSec: 'space-y-4',
    eduList: 'space-y-4',
    skillSec: 'space-y-2',
    projSec: 'space-y-4',
    projList: 'space-y-4',
  };
});

const previewType = computed(() => {
  const f = appearance.fontScale;
  if (f === 'sm') {
    return {
      h1: 'text-3xl',
      title: 'text-xs tracking-widest',
      meta: 'text-[9px]',
      h2: 'text-[9px]',
      h3: 'text-xs',
      body: 'text-[9px]',
      li: 'text-[9px]',
    };
  }
  if (f === 'lg') {
    return {
      h1: 'text-[2.5rem]',
      title: 'text-sm tracking-widest',
      meta: 'text-[11px]',
      h2: 'text-xs',
      h3: 'text-sm',
      body: 'text-xs',
      li: 'text-xs',
    };
  }
  return {
    h1: 'text-4xl',
    title: 'text-sm tracking-widest',
    meta: 'text-[10px]',
    h2: 'text-xs',
    h3: 'text-sm',
    body: 'text-[11px]',
    li: 'text-[10px]',
  };
});

const previewHeadlineFontClass = computed(() => {
  switch (appearance.headlineFont) {
    case 'neutral':
      return 'font-body';
    case 'classic':
      return 'font-serif';
    default:
      return 'font-headline';
  }
});

const previewAvatarSizeClass = computed(() => {
  const f = appearance.fontScale;
  if (f === 'sm') return 'w-16 h-16 sm:w-20 sm:h-20';
  if (f === 'lg') return 'w-24 h-24 sm:w-28 sm:h-28';
  return 'w-20 h-20 sm:w-24 sm:h-24';
});

const previewHeaderClasses = computed(() => {
  switch (activeTemplate.value.layout) {
    case 'minimal':
      return 'pb-8 border-b border-neutral-200';
    case 'executive':
      return 'pb-6 border-b-2';
    case 'creative':
      return 'pb-8 border-b-[10px] rounded-b-2xl';
    case 'stripe':
      return 'pb-6 pl-5 border-l-[6px] border-solid border-b border-neutral-100';
    case 'magazine':
      return 'pb-8 border-b';
    case 'tech':
      return 'pb-6 border-b-2';
    case 'elegant':
      return 'pb-8 border-b';
    default:
      return 'border-b-4 pb-8';
  }
});

const previewHeaderBorderStyle = computed(() => {
  const L = activeTemplate.value.layout;
  if (L === 'minimal') return {};
  if (L === 'stripe') return { borderLeftColor: appearance.accent };
  if (L === 'magazine' || L === 'elegant') return { borderColor: withAlpha(appearance.accent, L === 'elegant' ? 0.42 : 0.32) };
  return { borderColor: appearance.accent };
});

const previewHeaderRowClass = computed(() => {
  if (activeTemplate.value.layout === 'magazine')
    return 'flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-6';
  return 'gap-5 sm:gap-6 items-start';
});

const previewHeaderTextAlignClass = computed(() =>
  activeTemplate.value.layout === 'magazine' ? 'text-center sm:text-left w-full' : '',
);

const previewMetaRowClass = computed(() =>
  activeTemplate.value.layout === 'magazine' ? 'justify-center sm:justify-start' : '',
);

const sectionHeadingClass = computed(() => {
  switch (activeTemplate.value.layout) {
    case 'minimal':
      return 'font-bold tracking-normal normal-case text-xs text-on-surface border-l-4 border-solid pl-3 py-0.5';
    case 'executive':
      return 'font-bold uppercase tracking-[0.12em] text-[10px] text-on-surface border-b-2 border-solid pb-1 inline-block';
    case 'creative':
      return 'font-bold uppercase tracking-wider text-xs text-on-surface rounded-md px-2 py-1.5';
    case 'stripe':
      return 'font-bold uppercase tracking-[0.2em] text-[9px] text-on-surface border-l-2 border-solid pl-3 py-0.5';
    case 'magazine':
      return 'font-bold uppercase tracking-[0.22em] text-xs text-on-surface border-b border-solid inline-block pb-1 pr-8';
    case 'tech':
      return 'font-mono font-bold uppercase tracking-wider text-[9px] text-on-surface';
    case 'elegant':
      return 'font-serif font-semibold italic text-xs text-on-surface tracking-wide';
    case 'timeline':
      return 'font-bold uppercase tracking-[0.18em] text-[10px] text-on-surface';
    case 'sidebar':
      return 'font-bold uppercase tracking-[0.15em] text-[10px]';
    default:
      return 'font-bold uppercase tracking-[0.2em] text-outline';
  }
});

const sectionHeadingStyle = computed(() => {
  const L = activeTemplate.value.layout;
  if (L === 'minimal') return { borderLeftColor: appearance.accent };
  if (L === 'executive') return { borderBottomColor: appearance.accent };
  if (L === 'creative') return { backgroundColor: withAlpha(appearance.accent, 0.12) };
  if (L === 'stripe') return { borderLeftColor: appearance.accent };
  if (L === 'magazine') return { borderBottomColor: appearance.accent };
  if (L === 'tech') return { color: appearance.accent };
  if (L === 'timeline') return { color: appearance.accent };
  if (L === 'sidebar') return { color: appearance.accent };
  return {};
});

const jobTitleTemplateClass = computed(() => {
  const L = activeTemplate.value.layout;
  if (L === 'minimal') return 'normal-case tracking-tight';
  if (L === 'magazine') return 'uppercase tracking-[0.2em]';
  if (L === 'elegant') return 'normal-case tracking-wide font-medium italic';
  return 'uppercase tracking-widest';
});

const previewNameClass = computed(() => {
  const L = activeTemplate.value.layout;
  if (L === 'magazine') return 'font-extrabold';
  if (L === 'elegant') return 'font-serif font-bold';
  if (L === 'minimal') return 'font-semibold';
  return 'font-extrabold';
});

const resume = reactive({
  avatar: '',
  name: '张小凡',
  title: '资深产品设计师',
  email: 'zhangxiaofan@email.com',
  phone: '',
  location: '中国，北京',
  summary:
    '以用户为中心的产品设计师，拥有超过8年的构建可扩展设计系统和直观SaaS界面的经验。在提高用户参与度和简化设计到代码的工作流程方面有良好的记录。',
  work: [
    {
      id: newId(),
      position: '资深产品设计师',
      company: '策展科技有限公司',
      start: '2021-01',
      end: '',
      description:
        '主导设计系统重构，使开发效率提升了40%。\n指导4名初级设计师，并与跨职能合作伙伴协作。\n采用轻量极简原则构建了旗舰编辑器界面。',
    },
    {
      id: newId(),
      position: 'UI设计师',
      company: '某创意机构',
      start: '2018-01',
      end: '2020-12',
      description: '负责 Web 与移动端界面设计，参与品牌视觉升级。',
    },
  ] as WorkEntry[],
  education: [
    {
      id: newId(),
      school: '',
      degree: '',
      major: '',
      start: '',
      end: '',
    },
  ] as EduEntry[],
  skills: 'Figma / Sketch\n设计系统\n用户研究与可用性测试\n跨团队沟通协作',
  projects: [
    {
      id: newId(),
      name: '',
      role: '',
      detail: '',
    },
  ] as ProjectEntry[],
});

activeWorkId.value = resume.work[0]!.id;

const skillLines = computed(() =>
  resume.skills
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
);

function workSortWeight(value: string, treatEmptyAsCurrent = false): number {
  const v = value.trim();
  if (!v) {
    return treatEmptyAsCurrent ? toMonthStartTimestamp(currentMonthValue()) : Number.MIN_SAFE_INTEGER;
  }
  const ts = toMonthStartTimestamp(v);
  return Number.isNaN(ts) ? Number.MIN_SAFE_INTEGER : ts;
}

const sortedWorkEntries = computed(() => {
  return [...resume.work].sort((a, b) => {
    const endDiff = workSortWeight(b.end, true) - workSortWeight(a.end, true);
    if (endDiff !== 0) return endDiff;
    const startDiff = workSortWeight(b.start) - workSortWeight(a.start);
    if (startDiff !== 0) return startDiff;
    return a.id.localeCompare(b.id);
  });
});

function bulletsFromDescription(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatMonthLabel(value: string, allowPresent = false): string {
  const v = value.trim();
  if (!v) return allowPresent ? '至今' : '';
  const m = v.match(/^(\d{4})-(\d{2})/);
  if (!m) return v;
  if (allowPresent) {
    const currentMonth = currentMonthValue();
    if (v === currentMonth) return '至今';
  }
  return `${m[1]}年${Number(m[2])}月`;
}

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function toMonthStartTimestamp(input: any): number {
  if (!input) return Number.NaN;
  if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), 1).getTime();
  if (typeof input === 'string' || typeof input === 'number') {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return Number.NaN;
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }
  if (typeof input === 'object') {
    if (typeof input.toDate === 'function') {
      const d = input.toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) {
        return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      }
    }
    if (typeof input.year === 'function' && typeof input.month === 'function') {
      const y = Number(input.year());
      const m = Number(input.month());
      if (!Number.isNaN(y) && !Number.isNaN(m)) return new Date(y, m, 1).getTime();
    }
  }
  return Number.NaN;
}

function disableAfterCurrentMonth(dateLike: any): boolean {
  const now = new Date();
  const currentTs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const targetTs = toMonthStartTimestamp(dateLike);
  if (Number.isNaN(targetTs)) return false;
  return targetTs > currentTs;
}

function isCurrentMonthCell(cell: any): boolean {
  if (!cell?.date) return false;
  const d = new Date(cell.date);
  if (Number.isNaN(d.getTime())) return false;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonthValue();
}

function monthCellLabel(cell: any): string {
  if (!cell?.date) return '';
  if (isCurrentMonthCell(cell)) return '至今';
  const d = new Date(cell.date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}月`;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildResumeHtml(printMode = false): string {
  const summary = resume.summary.trim() ? `<section><h2>个人总结</h2><p>${escapeHtml(resume.summary)}</p></section>` : '';
  const work = sortedWorkEntries.value.length
    ? `<section><h2>工作经历</h2>${sortedWorkEntries.value
        .map((w) => {
          const bullets = bulletsFromDescription(w.description)
            .map((b) => `<li>${escapeHtml(b)}</li>`)
            .join('');
          return `<article class="item">
            <div class="title-row">
              <h3>${escapeHtml(w.position || '职位')}</h3>
              <span>${escapeHtml(formatMonthLabel(w.start))} — ${escapeHtml(formatMonthLabel(w.end, true))}</span>
            </div>
            <p class="company">${escapeHtml(w.company)}</p>
            ${bullets ? `<ul>${bullets}</ul>` : ''}
          </article>`;
        })
        .join('')}</section>`
    : '';
  const skills = skillLines.value.length
    ? `<section><h2>专业技能</h2><ul>${skillLines.value.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul></section>`
    : '';
  const projects = resume.projects.some((p) => p.name.trim())
    ? `<section><h2>项目经验</h2>${resume.projects
        .filter((p) => p.name.trim())
        .map(
          (p) => `<article class="item">
          <div class="title-row"><h3>${escapeHtml(p.name)}</h3><span>${escapeHtml(p.role)}</span></div>
          <p>${escapeHtml(p.detail)}</p>
        </article>`,
        )
        .join('')}</section>`
    : '';

  const autoPrint = printMode
    ? `<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),200));<\/script>`
    : '';

  const avatarHtml = resume.avatar
    ? `<img src="${resume.avatar}" alt="头像" class="avatar" referrerpolicy="no-referrer"/>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(resume.name)} - 简历</title>
  <style>
    body{font-family:Inter,'Noto Sans SC',sans-serif;background:#f3f4f6;margin:0;padding:20px;color:#111827}
    .page{max-width:860px;margin:0 auto;background:#fff;padding:36px;border-radius:8px}
    header{display:flex;align-items:flex-start;gap:20px}
    .avatar{width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #e5e7eb}
    .header-info{flex:1;min-width:0}
    h1{margin:0 0 6px;font-size:32px}
    .accent{color:${appearance.accent};font-weight:700;margin-bottom:10px}
    .meta{font-size:12px;color:#4b5563;display:flex;gap:14px;flex-wrap:wrap}
    section{margin-top:22px}
    h2{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${appearance.accent};margin:0 0 10px}
    h3{margin:0;font-size:16px}
    .title-row{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
    .title-row span{font-size:12px;color:#6b7280;font-weight:700}
    .company{margin:4px 0 6px;color:${appearance.accent};font-style:italic;font-size:12px}
    p{margin:0;font-size:13px;line-height:1.7;white-space:pre-wrap}
    ul{margin:6px 0 0 16px;padding:0}
    li{font-size:13px;line-height:1.7}
    .item{margin-bottom:14px}
  </style></head><body>
  <main class="page">
    <header>
      ${avatarHtml}
      <div class="header-info">
        <h1>${escapeHtml(resume.name || '姓名')}</h1>
        <div class="accent">${escapeHtml(resume.title || '求职意向')}</div>
        <div class="meta">
          ${resume.email ? `<span>邮箱：${escapeHtml(resume.email)}</span>` : ''}
          ${resume.phone ? `<span>电话：${escapeHtml(resume.phone)}</span>` : ''}
          ${resume.location ? `<span>地点：${escapeHtml(resume.location)}</span>` : ''}
        </div>
      </div>
    </header>
    ${summary}${work}${skills}${projects}
  </main>${autoPrint}</body></html>`;
}

/** 点击「上传在线网页」：未登录先弹登录框，已登录直接打开发布弹窗 */
function onClickPublish() {
  if (!authStore.isLoggedIn) {
    showAuthModal.value = true;
    return;
  }
  showPublishDialog.value = true;
}

function closePublishDialog() {
  if (publishing.value) return;
  showPublishDialog.value = false;
  publishedUrl.value = '';
  slugInputConflict.value = false;
}

/** 登录/注册成功后回调 */
function onAuthSuccess() {
  showPublishDialog.value = true;
}

async function publishToWeb() {
  const html = buildResumeHtml(false);
  const apiBase = authStore.apiBase();
  const slug = publishSlug.value.trim().toLowerCase();

  publishing.value = true;
  publishedUrl.value = '';
  try {
    const res = await fetch(`${apiBase}/api/resume/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.authHeader(),
      },
      body: JSON.stringify({ html, ...(slug ? { slug } : {}) }),
    });

    let data: { error?: string; id?: string; url?: string } = {};
    try { data = await res.json(); } catch { /* 非 JSON 响应 */ }

    if (res.status === 401) {
      // Token 过期：关闭发布弹窗，弹出登录框
      authStore.logout();
      closePublishDialog();
      showAuthModal.value = true;
      return;
    }
    if (res.status === 409) {
      // 后缀冲突：弹窗内输入框变红提示
      slugInputConflict.value = true;
      return;
    }
    if (!res.ok) throw new Error(data.error ?? `发布失败 (${res.status})`);
    if (!data.url) throw new Error('服务响应异常');

    const origin = apiBase || window.location.origin;
    const full = `${origin}${data.url}`;
    publishedUrl.value = full;
    slugInputConflict.value = false;
    try { await navigator.clipboard.writeText(full); } catch { /* 复制失败不报错 */ }
    window.open(full, '_blank', 'noopener,noreferrer');
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '发布失败，请稍后重试');
  } finally {
    publishing.value = false;
  }
}

function copyUrl() {
  if (!publishedUrl.value) return;
  navigator.clipboard.writeText(publishedUrl.value)
    .then(() => ElMessage.success('已复制'))
    .catch(() => ElMessage.warning('复制失败，请手动复制'));
}

function exportPdf() {
  const html = buildResumeHtml(true);
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  window.open(url, '_blank', 'noopener,noreferrer');
}

function addWork() {
  const id = newId();
  resume.work.push({
    id,
    position: '',
    company: '',
    start: '',
    end: '',
    description: '',
  });
  activeWorkId.value = id;
}

function removeWork(id: string) {
  const idx = resume.work.findIndex((w) => w.id === id);
  if (idx === -1) return;
  if (resume.work.length <= 1) {
    resume.work[idx]!.position = '';
    resume.work[idx]!.company = '';
    resume.work[idx]!.start = '';
    resume.work[idx]!.end = '';
    resume.work[idx]!.description = '';
    return;
  }
  resume.work.splice(idx, 1);
  activeWorkId.value = resume.work[Math.min(idx, resume.work.length - 1)]!.id;
}

function addEducation() {
  resume.education.push({
    id: newId(),
    school: '',
    degree: '',
    major: '',
    start: '',
    end: '',
  });
}

function addProject() {
  resume.projects.push({
    id: newId(),
    name: '',
    role: '',
    detail: '',
  });
}
</script>

<style scoped>
.section-tab-enter-active,
.section-tab-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.section-tab-enter-from,
.section-tab-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.work-switch-enter-active,
.work-switch-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.work-switch-enter-from,
.work-switch-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.995);
}

:deep(.edu-degree-select .el-select__wrapper) {
  min-height: 46px;
  border-radius: 0.5rem;
  background: var(--color-surface-container-lowest);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-outline-variant) 30%, transparent);
  padding: 0 12px;
  transition: box-shadow 160ms ease;
}

:deep(.edu-degree-select .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 2px var(--color-primary-fixed);
}

:deep(.edu-degree-select .el-select__placeholder) {
  color: color-mix(in oklab, var(--color-on-surface-variant) 60%, transparent);
  font-size: 0.875rem;
}

:deep(.edu-degree-select .el-select__selected-item) {
  color: var(--color-on-surface);
  font-size: 0.95rem;
}

:deep(.edu-degree-popper.el-select-dropdown) {
  border-radius: 0.75rem;
  border: 1px solid color-mix(in oklab, var(--color-outline-variant) 35%, transparent);
}

</style>
