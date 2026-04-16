import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Layout from '@/components/Layout.vue';
import Landing from '@/pages/Landing.vue';
import Templates from '@/pages/Templates.vue';
import Contact from '@/pages/Contact.vue';
import Editor from '@/pages/Editor.vue';
import MyPublishedResumes from '@/pages/MyPublishedResumes.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Landing',
        component: Landing,
      },
      {
        path: 'templates',
        name: 'Templates',
        component: Templates,
      },
      {
        path: 'contact',
        name: 'Contact',
        component: Contact,
      },
      {
        path: 'account/resumes',
        name: 'MyPublishedResumes',
        component: MyPublishedResumes,
      },
    ],
  },
  {
    path: '/editor',
    name: 'Editor',
    component: Editor,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
