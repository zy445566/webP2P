import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Element from '@/components/Element'
import TakeShot from '@/components/TakeShot'
import BasicPeer from '@/components/BasicPeer'
import DataPeer from '@/components/DataPeer'
import TextPeer from '@/components/TextPeer'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/data-peer',
      name: 'DataPeer',
      component: DataPeer
    },
    {
      path: '/',
      name: 'TextPeer',
      component: TextPeer
    },
    {
      path: '/basic-peer',
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
