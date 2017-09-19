<template>
  <div class="data-peer">
    <h1>生成文件并传输</h1>
    <section>
      <div id="button">
        <button id="sendTheData" type="button">Generate and send data</button>
      </div>
      <div class="input">
        <input type="number" id="megsToSend" min="1" name="megs" value="128"/>
        <label for="megsToSend">MB</label>
        <div id="errorMsg"></div>
      </div>
      <div class="input">
        <input type="checkbox" id="ordered" checked>
        <label for="ordered">Ordered mode</label>
      </div>
      <div class="progress">
        <div class="label">Send progress: </div>
        <progress id="sendProgress" max="0" value="0"></progress>
      </div>

      <div class="progress">
        <div class="label">Receive progress: </div>
        <progress id="receiveProgress" max="0" value="0"></progress>
      </div>
    </section>

    
  </div>
</template>

<script>
export default {
  name: 'data-peer',
  data () {
    return {
      localConnection:null,
      remoteConnection:null,
      sendChannel:null,
      receiveChannel:null,
      pcConstraint:null,
      megsToSend:null,
      sendButton:null,
      orderedCheckbox:null,
      sendProgress:null,
      receiveProgress:null,
      errorMessage:null,
      receivedSize:0,
      bytesToSend:0,
    }
  },
  mounted: function () {
    this.megsToSend = document.querySelector('input#megsToSend');
    this.sendButton = document.querySelector('button#sendTheData');
    this.orderedCheckbox = document.querySelector('input#ordered');
    this.sendProgress = document.querySelector('progress#sendProgress');
    this.receiveProgress = document.querySelector('progress#receiveProgress');
    this.errorMessage = document.querySelector('div#errorMsg');
    this.sendButton.onclick = this.createConnection;
    self = this;
    this.megsToSend.addEventListener('change', function(e) {
      if (this.value <= 0) {
        self.sendButton.disabled = true;
        self.errorMessage.innerHTML = '<p>Please enter a number greater than zero.</p>';
      } else {
        self.errorMessage.innerHTML = '';
        self.sendButton.disabled = false;
      }
    });
  },
  methods: {
    createConnection : function () {
      this.sendButton.disabled = true;
      this.megsToSend.disabled = true;
      var servers = null;
      this.pcConstraint = null;

      this.bytesToSend = Math.round(megsToSend.value) * 1024 * 1024;

      // Add localConnection to global scope to make it visible
      // from the browser console.
      window.localConnection = this.localConnection = new RTCPeerConnection(servers,
          this.pcConstraint);
      

      var dataChannelParams = {ordered: false};
      if (this.orderedCheckbox.checked) {
        dataChannelParams.ordered = true;
      }

      this.sendChannel = this.localConnection.createDataChannel(
          'sendDataChannel', dataChannelParams);
      this.sendChannel.binaryType = 'arraybuffer';
      

      this.sendChannel.onopen = this.onSendChannelStateChange;
      this.sendChannel.onclose = this.onSendChannelStateChange;
      this.localConnection.onicecandidate = (e)=> {
        this.onIceCandidate(this.localConnection, e);
      };

      this.localConnection.createOffer().then(
        this.gotDescription1,
        this.onCreateSessionDescriptionError
      );
      window.remoteConnection = this.remoteConnection = new RTCPeerConnection(servers,
          this.pcConstraint);
      

      this.remoteConnection.onicecandidate = (e)=> {
        this.onIceCandidate(this.remoteConnection, e);
      };
      this.remoteConnection.ondatachannel = this.receiveChannelCallback;
    },
    onCreateSessionDescriptionError : function (error) {
      
    },
    randomAsciiString : function (length) {
      var result = '';
      for (var i = 0; i < length; i++) {
        // Visible ASCII chars are between 33 and 126.
        result += String.fromCharCode(33 + Math.random() * 93);
      }
      return result;
    },
    sendGeneratedData : function () {
      this.sendProgress.max = this.bytesToSend;
      this.receiveProgress.max = this.sendProgress.max;
      this.sendProgress.value = 0;
      this.receiveProgress.value = 0;

      var chunkSize = 16384;
      var stringToSendRepeatedly = this.randomAsciiString(chunkSize);
      var bufferFullThreshold = 5 * chunkSize;
      var usePolling = true;
      if (typeof this.sendChannel.bufferedAmountLowThreshold === 'number') {
        
        usePolling = false;

        // Reduce the buffer fullness threshold, since we now have more efficient
        // buffer management.
        bufferFullThreshold = chunkSize / 2;

        // This is "overcontrol": our high and low thresholds are the same.
        this.sendChannel.bufferedAmountLowThreshold = bufferFullThreshold;
      }
      // Listen for one bufferedamountlow event.
      var listener = ()=> {
        this.sendChannel.removeEventListener('bufferedamountlow', listener);
        sendAllData();
      };
      var sendAllData = () => {
        // Try to queue up a bunch of data and back off when the channel starts to
        // fill up. We don't setTimeout after each send since this lowers our
        // throughput quite a bit (setTimeout(fn, 0) can take hundreds of milli-
        // seconds to execute).
        while (this.sendProgress.value < this.sendProgress.max) {
          if (this.sendChannel.bufferedAmount > bufferFullThreshold) {
            if (usePolling) {
              setTimeout(sendAllData, 250);
            } else {
              this.sendChannel.addEventListener('bufferedamountlow', listener);
            }
            return;
          }
          this.sendProgress.value += chunkSize;
          this.sendChannel.send(stringToSendRepeatedly);
        }
      };
      setTimeout(sendAllData, 0);
    },
    closeDataChannels : function () {
      
      this.sendChannel.close();
      
      this.receiveChannel.close();
      
      this.localConnection.close();
      this.remoteConnection.close();
      this.localConnection = null;
      this.remoteConnection = null;
      
    },
    gotDescription1 : function (desc) {
      this.localConnection.setLocalDescription(desc);
      
      this.remoteConnection.setRemoteDescription(desc);
      this.remoteConnection.createAnswer().then(
        this.gotDescription2,
        this.onCreateSessionDescriptionError
      );
    },
    gotDescription2 : function (desc) {
      this.remoteConnection.setLocalDescription(desc);
      
      this.localConnection.setRemoteDescription(desc);
    },
    getOtherPc : function (pc) {
      return (pc === this.localConnection) ? this.remoteConnection : this.localConnection;
    },
    getName : function (pc) {
      return (pc === this.localConnection) ? 'localPeerConnection' :
          'remotePeerConnection';
    },
    onIceCandidate : function (pc, event) {
      this.getOtherPc(pc).addIceCandidate(event.candidate)
      .then(
        ()=> {
          this.onAddIceCandidateSuccess(pc);
        },
        (err)=> {
          this.onAddIceCandidateError(pc, err);
        }
      );
    },
    onAddIceCandidateSuccess : function () {
      
    },
    onAddIceCandidateError : function (error) {
      
    },
    receiveChannelCallback : function (event) {
      
      this.receiveChannel = event.channel;
      this.receiveChannel.binaryType = 'arraybuffer';
      this.receiveChannel.onmessage = this.onReceiveMessageCallback;
      this.receivedSize = 0;
    },
    onReceiveMessageCallback : function (event) {
      this.receivedSize += event.data.length;
      this.receiveProgress.value = this.receivedSize;

      if (this.receivedSize === this.bytesToSend) {
        this.closeDataChannels();
        this.sendButton.disabled = false;
        this.megsToSend.disabled = false;
      }
    },
    onSendChannelStateChange : function () {
      var readyState = this.sendChannel.readyState;
      
      if (readyState === 'open') {
        this.sendGeneratedData();
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
