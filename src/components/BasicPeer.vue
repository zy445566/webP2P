<template>
  <div class="take-shot">
    <h1>基本的点对点传输</h1>
    <section>
      <form id="fileInfo">
        <input type="file" id="fileInput" name="files"/>
      </form>

      <div class="progress">
        <div class="label">Send progress: </div>
        <progress id="sendProgress" max="0" value="0"></progress>
      </div>

      <div class="progress">
        <div class="label">Receive progress: </div>
        <progress id="receiveProgress" max="0" value="0"></progress>
      </div>

      <div id="bitrate"></div>
      <a id="download"></a>
      <span id="status"></span>

    </section>

    
  </div>
</template>

<script>
export default {
  name: 'take-shot',
  data () {
    return {
      localConnection:null,
      remoteConnection:null,
      sendChannel:null,
      receiveChannel:null,
      pcConstraint:null,
      bitrateDiv : null,
      fileInput : null,
      downloadAnchor : null,
      sendProgress : null,
      receiveProgress : null,
      statusMessage : null,
      receiveBuffer : [],
      receivedSize : 0,
      bytesPrev : 0,
      timestampPrev : 0,
      timestampStart:null,
      statsInterval : null,
      bitrateMax : 0,
    }
  },
  mounted: function () {
    this.bitrateDiv = document.querySelector('div#bitrate');
    this.fileInput = document.querySelector('input#fileInput');
    this.downloadAnchor = document.querySelector('a#download');
    this.sendProgress = document.querySelector('progress#sendProgress');
    this.receiveProgress = document.querySelector('progress#receiveProgress');
    this.statusMessage = document.querySelector('span#status');
    this.fileInput.addEventListener('change', this.handleFileInputChange, false);
  },
  methods: {
    handleFileInputChange:function () {
      var file = fileInput.files[0];
      if (!file) {
        console.trace('No file chosen');
      } else {
        this.createConnection();
      }
    },
    createConnection:function () {
      var servers = null;
      this.pcConstraint = null;

      // Add localConnection to global scope to make it visible
      // from the browser console.
      window.localConnection = this.localConnection = new RTCPeerConnection(servers,
          this.pcConstraint);
      console.trace('Created local peer connection object localConnection');

      this.sendChannel = this.localConnection.createDataChannel('sendDataChannel');
      this.sendChannel.binaryType = 'arraybuffer';
      console.trace('Created send data channel');

      this.sendChannel.onopen = this.onSendChannelStateChange;
      this.sendChannel.onclose = this.onSendChannelStateChange;
      this.localConnection.onicecandidate = (e) => {
        this.onIceCandidate(this.localConnection, e);
      };

      this.localConnection.createOffer().then(
        this.gotDescription1,
        this.onCreateSessionDescriptionError
      );
      // Add remoteConnection to global scope to make it visible
      // from the browser console.
      window.remoteConnection = this.remoteConnection = new RTCPeerConnection(servers,
          this.pcConstraint);
      console.trace('Created remote peer connection object this.remoteConnection');

      this.remoteConnection.onicecandidate = (e) => {
        this.onIceCandidate(this.remoteConnection, e);
      };
      this.remoteConnection.ondatachannel = this.receiveChannelCallback;
      this.fileInput.disabled = true;
    },
    onCreateSessionDescriptionError:function (error) {
      console.trace('Failed to create session description: ' + error.toString());
    },
    sendData:function () {
      var file = this.fileInput.files[0];
      console.trace('File is ' + [file.name, file.size, file.type,
          file.lastModifiedDate
      ].join(' '));

      // Handle 0 size files.
      this.statusMessage.textContent = '';
      this.downloadAnchor.textContent = '';
      if (file.size === 0) {
        this.bitrateDiv.innerHTML = '';
        this.statusMessage.textContent = 'File is empty, please select a non-empty file';
        closeDataChannels();
        return;
      }
      this.sendProgress.max = file.size;
      this.receiveProgress.max = file.size;
      var chunkSize = 16384;
      var sliceFile = function(offset) {
        var reader = new window.FileReader();
        reader.onload = (function() {
          return function(e) {
            this.sendChannel.send(e.target.result);
            if (file.size > offset + e.target.result.byteLength) {
              window.setTimeout(sliceFile, 0, offset + chunkSize);
            }
            sendProgress.value = offset + e.target.result.byteLength;
          };
        })(file);
        var slice = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(slice);
      };
      sliceFile(0);
    },
    closeDataChannels:function () {
      console.trace('Closing data channels');
      this.sendChannel.close();
      console.trace('Closed data channel with label: ' + sendChannel.label);
      if (receiveChannel) {
        this.receiveChannel.close();
        console.trace('Closed data channel with label: ' + receiveChannel.label);
      }
      this.localConnection.close();
      this.remoteConnection.close();
      this.localConnection = null;
      this.remoteConnection = null;
      console.trace('Closed peer connections');

      // re-enable the file select
      this.fileInput.disabled = false;
    },
    gotDescription1:function (desc) {
      this.localConnection.setLocalDescription(desc);
      console.trace('Offer from localConnection \n' + desc.sdp);
      this.remoteConnection.setRemoteDescription(desc);
      this.remoteConnection.createAnswer().then(
        this.gotDescription2,
        this.onCreateSessionDescriptionError
      );
    },
    gotDescription2:function (desc) {
      this.remoteConnection.setLocalDescription(desc);
      console.trace('Answer from remoteConnection \n' + desc.sdp);
      this.localConnection.setRemoteDescription(desc);
    },
    getOtherPc:function (pc) {
      return (pc === this.localConnection) ? this.remoteConnection : this.localConnection;
    },
    getName:function (pc) {
      return (pc === this.localConnection) ? 'localPeerConnection' :
          'remotePeerConnection';
    },
    onIceCandidate:function (pc, event) {
      this.getOtherPc(pc).addIceCandidate(event.candidate)
      .then(
        ()=> {
          this.onAddIceCandidateSuccess(pc);
        },
        (err)=> {
          this.onAddIceCandidateError(pc, err);
        }
      );
      console.trace(this.getName(pc) + ' ICE candidate: \n' + (event.candidate ?
          event.candidate.candidate : '(null)'));
    },
    onAddIceCandidateSuccess:function () {
      console.trace('AddIceCandidate success.');
    },
    onAddIceCandidateError:function (error) {
      console.trace('Failed to add Ice Candidate: ' + error.toString());
    },
    receiveChannelCallback:function (event) {
      console.trace('Receive Channel Callback');
      this.receiveChannel = event.channel;
      this.receiveChannel.binaryType = 'arraybuffer';
      this.receiveChannel.onmessage = this.onReceiveMessageCallback;
      this.receiveChannel.onopen = this.onReceiveChannelStateChange;
      this.receiveChannel.onclose = this.onReceiveChannelStateChange;

      this.receivedSize = 0;
      this.bitrateMax = 0;
      this.downloadAnchor.textContent = '';
      this.downloadAnchor.removeAttribute('download');
      if (this.downloadAnchor.href) {
        URL.revokeObjectURL(this.downloadAnchor.href);
        this.downloadAnchor.removeAttribute('href');
      }
    },
    onReceiveMessageCallback:function (event) {
      // console.trace('Received Message ' + event.data.byteLength);
      this.receiveBuffer.push(event.data);
      this.receivedSize += event.data.byteLength;

      this.receiveProgress.value = this.receivedSize;

      // we are assuming that our signaling protocol told
      // about the expected file size (and name, hash, etc).
      var file = fileInput.files[0];
      if (this.receivedSize === file.size) {
        var received = new window.Blob(this.receiveBuffer);
        this.receiveBuffer = [];

        this.downloadAnchor.href = URL.createObjectURL(received);
        this.downloadAnchor.download = file.name;
        this.downloadAnchor.textContent =
          'Click to download \'' + file.name + '\' (' + file.size + ' bytes)';
        this.downloadAnchor.style.display = 'block';

        var bitrate = Math.round(this.receivedSize * 8 /
            ((new Date()).getTime() - this.timestampStart));
        this.bitrateDiv.innerHTML = '<strong>Average Bitrate:</strong> ' +
            bitrate + ' kbits/sec (max: ' + bitrateMax + ' kbits/sec)';

        if (this.statsInterval) {
          window.clearInterval(this.statsInterval);
          this.statsInterval = null;
        }

        closeDataChannels();
      }
    },
    onSendChannelStateChange:function () {
      var readyState = this.sendChannel.readyState;
      console.trace('Send channel state is: ' + readyState);
      if (readyState === 'open') {
        sendData();
      }
    },
    onReceiveChannelStateChange:function () {
      var readyState = this.receiveChannel.readyState;
      console.trace('Receive channel state is: ' + readyState);
      if (readyState === 'open') {
        this.timestampStart = (new Date()).getTime();
        this.timestampPrev = this.timestampStart;
        this.statsInterval = window.setInterval(this.displayStats, 500);
        window.setTimeout(this.displayStats, 100);
        window.setTimeout(this.displayStats, 300);
      }
    },
    displayStats:function () {
      var display = function(bitrate) {
        this.bitrateDiv.innerHTML = '<strong>Current Bitrate:</strong> ' +
            bitrate + ' kbits/sec';
      };

      if (this.remoteConnection && this.remoteConnection.iceConnectionState === 'connected') {
        if (adapter.browserDetails.browser === 'chrome') {
          // TODO: once https://code.google.com/p/webrtc/issues/detail?id=4321
          // lands those stats should be preferrred over the connection stats.
          this.remoteConnection.getStats(null, function(stats) {
            for (var key in stats) {
              var res = stats[key];
              if (this.timestampPrev === res.timestamp) {
                return;
              }
              if (res.type === 'googCandidatePair' &&
                  res.googActiveConnection === 'true') {
                // calculate current bitrate
                var bytesNow = res.bytesReceived;
                var bitrate = Math.round((bytesNow - this.bytesPrev) * 8 /
                    (res.timestamp - this.timestampPrev));
                display(bitrate);
                this.timestampPrev = res.timestamp;
                this.bytesPrev = bytesNow;
                if (bitrate > this.bitrateMax) {
                  this.bitrateMax = bitrate;
                }
              }
            }
          });
        } else {
          // Firefox currently does not have data channel stats. See
          // https://bugzilla.mozilla.org/show_bug.cgi?id=1136832
          // Instead, the bitrate is calculated based on the number of
          // bytes received.
          var bytesNow = receivedSize;
          var now = (new Date()).getTime();
          var bitrate = Math.round((bytesNow - this.bytesPrev) * 8 /
              (now - this.timestampPrev));
          display(bitrate);
          this.timestampPrev = now;
          this.bytesPrev = bytesNow;
          if (bitrate > this.bitrateMax) {
            this.bitrateMax = bitrate;
          }
        }
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
