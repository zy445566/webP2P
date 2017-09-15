<template>
  <div class="take-shot">
    <h1>截图功能</h1>
    <div class="shots">
      <video autoplay src="/static/mov_bbb.mp4"></video>
      <button v-on:click="takeshots">截图功能</button>
      <canvas></canvas>
    </div>
    
  </div>
</template>

<script>
export default {
  name: 'take-shot',
  mounted: function () {
    this.canvas = document.querySelector('canvas');
    this.video = document.querySelector('video');
    this.button = document.querySelector('button');
    this.canvas.width = 320;
    this.canvas.height = 176;
    var constraints = {
      audio: true,
      video: true
    };
    navigator.mediaDevices.getUserMedia(constraints).
        then(this.handleSuccess).catch(this.handleError);
  },
  methods: {
    takeshots:function(){
      // this.canvas.width = this.video.videoWidth;
      // this.canvas.height = this.video.videoHeight;
      this.canvas.getContext('2d').
        drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    },
    handleSuccess:function (stream) {
      window.stream = stream; // make stream available to browser console
      this.video.srcObject = stream;
    },
    handleError:function (error) {
      console.log('navigator.getUserMedia error: ', error);
    }
  },
  data () {
    return {
      video: null,
      canvas: null,
      button: null,
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
