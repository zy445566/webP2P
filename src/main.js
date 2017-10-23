// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import 'element-ui/lib/theme-default/index.css'
import ElementUI from 'element-ui'
// import WebrtcAdapter from 'webrtc-adapter'
import socketClient from 'socket.io-client'
import Socketiop2p from 'socket.io-p2p'

Vue.use(ElementUI)
// Vue.use(WebrtcAdapter)

Vue.use({
  install:function(Vue){
    Vue.mixin({
      created(){
        this.io = socketClient;
        this.Socketiop2p = Socketiop2p;
      }
    });
  }
});

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
