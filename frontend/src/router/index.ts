import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/index.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      redirect: '/upload',
      children: [
        {
          path: 'upload',
          name: 'Upload',
          component: () => import('../views/upload/index.vue'),
        },
        {
          path: 'status',
          name: 'Status',
          component: () => import('../views/status/index.vue'),
        },
        {
          path: 'scripts',
          name: 'Scripts',
          component: () => import('../views/scripts/index.vue'),
        },
        {
          path: 'admin',
          name: 'Admin',
          component: () => import('../views/admin/index.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
