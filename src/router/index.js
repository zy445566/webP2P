import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Element from '@/components/Element'
import TakeShot from '@/components/TakeShot'
import BasicPeer from '@/components/BasicPeer'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'BasicPeer',
      component: BasicPeer
    },
    {
      path: '/hello',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/take-shot',
      name: 'TakeShot',
      component: TakeShot
    },
    {
      path: '/element',
      name: 'Element',
      component: Element
    },
  ]
})
