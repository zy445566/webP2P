<template>
  <div class="text-peer">
    <h1>P2P发送文本</h1>
    <section>
      <div id="buttons">
        <button id="startButton">Start</button>
        <button id="sendButton" disabled>Send</button>
        <button id="closeButton" disabled>Stop</button>
      </div>

      <div id="sendReceive">
        <div id="send">
          <h2>Send</h2>
          <textarea id="dataChannelSend" disabled placeholder="Press Start, enter some text, then press Send."></textarea>
        </div>
        <div id="receive">
          <h2>Receive</h2>
          <textarea id="dataChannelReceive" disabled></textarea>
        </div>
      </div>
    </section>

    
  </div>
</template>

<script>
export default {
  name: 'text-peer',
  data () {
    return {
      localConnection : null,
      remoteConnection : null,
      sendChannel : null,
      receiveChannel : null,
      pcConstraint : null,
      dataConstraint : null,
      dataChannelSend : null,
      dataChannelReceive : null,
      startButton : null,
      sendButton : null,
      closeButton : null
    }
  },
  mounted: function () {
    this.dataChannelSend = document.querySelector('textarea#dataChannelSend');
    this.dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
    this.startButton = document.querySelector('button#startButton');
    this.sendButton = document.querySelector('button#sendButton');
    this.closeButton = document.querySelector('button#closeButton');
    this.startButton.onclick = this.createConnection;
    this.sendButton.onclick = this.sendData;
    this.closeButton.onclick = this.closeDataChannels;
  },
  methods: {
    enableStartButton : function() {
      this.startButton.disabled = false;
    },
    disableSendButton : function() {
      this.sendButton.disabled = true;
    },
    createConnection : function() {
      this.dataChannelSend.placeholder = '';
      var servers = null;
      this.pcConstraint = null;
      this.dataConstraint = null;
      window.localConnection = this.localConnection =
          new RTCPeerConnection(servers, this.pcConstraint);
      this.sendChannel = localConnection.createDataChannel('sendDataChannel',
      this.dataConstraint);
      this.localConnection.onicecandidate = (e) => {
        this.onIceCandidate(this.localConnection, e);
      };
      this.sendChannel.onopen = this.onSendChannelStateChange;
      this.sendChannel.onclose = this.onSendChannelStateChange;
        // Add remoteConnection to global scope to make it visible
      // from the browser console.
      window.remoteConnection = this.remoteConnection =
          new RTCPeerConnection(servers, this.pcConstraint);
      this.remoteConnection.onicecandidate = (e) => {
        this.onIceCandidate(this.remoteConnection, e);
      };
      this.remoteConnection.ondatachannel = this.receiveChannelCallback;
        this.localConnection.createOffer().then(
        this.gotDescription1,
        this.onCreateSessionDescriptionError
      );
      this.startButton.disabled = true;
      this.closeButton.disabled = false;
    },
    onCreateSessionDescriptionError : function(error) {
      trace('Failed to create session description: ' + error.toString());
    },
    sendData : function() {
      var data = this.dataChannelSend.value;
      this.sendChannel.send(data);
    },
    closeDataChannels : function() {
      this.sendChannel.close();
      this.receiveChannel.close();
      this.localConnection.close();
      this.remoteConnection.close();
      this.localConnection = null;
      this.remoteConnection = null;
      
      this.startButton.disabled = false;
      this.sendButton.disabled = true;
      this.closeButton.disabled = true;
      this.dataChannelSend.value = '';
      this.dataChannelReceive.value = '';
      this.dataChannelSend.disabled = true;
      this.disableSendButton();
      this.enableStartButton();
    },
    gotDescription1 : function(desc) {
      this.localConnection.setLocalDescription(desc);
      this.remoteConnection.setRemoteDescription(desc);
      this.remoteConnection.createAnswer().then(
        this.gotDescription2,
        this.onCreateSessionDescriptionError
      );
    },
    gotDescription2 : function(desc) {
      this.remoteConnection.setLocalDescription(desc);
      this.localConnection.setRemoteDescription(desc);
    },
    getOtherPc : function(pc) {
      return (pc === this.localConnection) ? this.remoteConnection : this.localConnection;
    },
    getName : function(pc) {
      return (pc === this.localConnection) ? 'localPeerConnection' :
          'remotePeerConnection';
    },
    onIceCandidate : function(pc, event) {
      this.getOtherPc(pc).addIceCandidate(event.candidate)
      .then(
        () => {
          this.onAddIceCandidateSuccess(pc);
        },
        (err) => {
          this.onAddIceCandidateError(pc, err);
        }
      );
    },
    onAddIceCandidateSuccess : function() {
      
    },
    onAddIceCandidateError : function(error) {
    },
    receiveChannelCallback : function(event) {
      
      this.receiveChannel = event.channel;
      this.receiveChannel.onmessage = this.onReceiveMessageCallback;
      this.receiveChannel.onopen = this.onReceiveChannelStateChange;
      this.receiveChannel.onclose = this.onReceiveChannelStateChange;
    },
    onReceiveMessageCallback : function(event) {
      this.dataChannelReceive.value = event.data;
    },
    onSendChannelStateChange : function() {
      var readyState = this.sendChannel.readyState;
      if (readyState === 'open') {
        this.dataChannelSend.disabled = false;
        this.dataChannelSend.focus();
        this.sendButton.disabled = false;
        this.closeButton.disabled = false;
      } else {
        this.dataChannelSend.disabled = true;
        this.sendButton.disabled = true;
        this.closeButton.disabled = true;
      }
    },
    onReceiveChannelStateChange : function() {
      var readyState = this.receiveChannel.readyState;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
