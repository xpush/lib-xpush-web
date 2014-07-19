;(function() {

  var localStream;
  var pc;
  var remoteStream;
  var turnReady;

  var CONFIG = {};
  var STATUS = {
    READY: false,
    INIT: false,
    STARTED: false
  };


  var XWebRTC = function(host, app, channel, userId, localVideo, remoteVideo){
    var self = this;

    CONFIG.constraints = {video: true};
    CONFIG.pc = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
    CONFIG.pcConstraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};
    CONFIG.sdpConstraints = {'mandatory': {'OfferToReceiveAudio':true,'OfferToReceiveVideo':true }};

    this.channelName = channel;
    this.xpush = new XPush(host, app, this.eventHandler);
    this.xpush.createSimpleChannel(channel, userId, function(err, data){
      if(err){
        console.error("CHANNEL CREATE" ,err);
      }
    });

  };


  XWebRTC.prototype.eventHandler = function(type, data) {
    
    console.log('EVENT', type, data);
    var self = this;

    this.channel = this.xpush.getChannel(this.channelName);
    this.channel.on('message', function(data){
      console.log('MESSAGE', data);
    })

    if(data.event == 'CONNECTION'){
      // channel 연결 후!
      if(data.count == 1){

      }else if(data.count == 2){

      }else if(data.count == 0 || data.count > 2){
        console.error('something is wrong.. (_ _); ');

      }

      getUserMedia(constraints, this.handleUserMedia, this.handleUserMediaError);

    }
  }

  XWebRTC.prototype.handleUserMedia = function(stream) {
    console.log('Adding local stream.');
    localVideo.src = window.URL.createObjectURL(stream);
    localStream = stream;
    this.xpush.send(this.channelName, 'message', 'MEDIA');
    if (STATUS.INIT) {
      this.maybeStart();
    }
  };

  XWebRTC.prototype.handleUserMediaError = function(error){
    console.log('getUserMedia error: ', error);
  };

  window.XWebRTC = XWebRTC;

})();
