<template>
  <div class="basic-peer">
    <h1>socket+P2P</h1>
    <section>
       <section>
        <div id="buttons">
          <button id="sendButton">Send</button>
        </div>

        <div id="sendReceive">
          <div id="send">
            <h2>Send</h2>
            <textarea id="dataChannelSend" placeholder="Press Start, enter some text, then press Send."></textarea>
          </div>
          <div id="receive">
            <h2>Receive</h2>
            <span id="dataChannelReceive"></span>
          </div>
        </div>
      </section>

    </section>
  </div>
</template>

<script>
export default {
  name: 'socket-peer',
  data () {
    return {
      sendButton:null,
      dataChannelSend:null,
      dataChannelReceive:null,
      p2psocket:null
    }
  },
  mounted: function () {
    var socket = this.io("http://localhost:3030")
    var opts = {peerOpts: {trickle: false}, autoUpgrade: true}
    this.p2psocket = new this.Socketiop2p(socket, opts, function () {
      this.p2psocket.emit('peer-obj', 'Hello there. I am ' + this.p2psocket.peerId)
    });
    this.p2psocket.on('peer-msg', function (data) {
      dataChannelReceive.innerText += JSON.stringify(data)+"\r\n";
    });
    this.dataChannelSend = document.querySelector('textarea#dataChannelSend');
    this.dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
    this.sendButton = document.querySelector('button#sendButton');
    this.sendButton.onclick = this.sendData;
  },
  methods: {
    sendData:function () {
      this.p2psocket.emit('peer-msg', dataChannelSend.value);
      dataChannelSend.value = "";
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
