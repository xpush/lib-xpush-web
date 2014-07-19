;(function() {

  var localStream;
  var pc;
  var remoteStream;
  var turnReady;

  var xpush;
  var channel;
  var channelNm;

  var CONFIG = {};
  var STATUS = {
    READY: false,
    INIT: false,
    STARTED: false
  };

  var _initProcess = function (type, data){
    console.log('EVENT', type, data);

    if(data.event == 'CONNECTION'){
      // channel 연결 후!
      if(data.count == 1){

      }else if(data.count == 2){

      }else if(data.count == 0 || data.count > 2){
        console.error('something is wrong.. (_ _); ');

      }

      if(!channel){
        channel = xpush.getChannel(channelNm);
      }

      getUserMedia(CONFIG.constraints, handleUserMedia, handleUserMediaError);

    }

  };


  var XWebRTC = function(host, app, channelName, userId, localVideo, remoteVideo){
    var self = this;

    CONFIG.constraints = {video: true};
    CONFIG.pc = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
    CONFIG.pcConstraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};
    CONFIG.sdpConstraints = {'mandatory': {'OfferToReceiveAudio':true,'OfferToReceiveVideo':true }};

    channelNm = channelName;
    xpush = new XPush(host, app, _initProcess);

    xpush.createSimpleChannel(channelNm, userId, function(err, data){
      if(err){
        console.error("CHANNEL CREATE" ,err);
      }
    });

    xpush.on('message',function(ch,name,data){
      console.log(ch,name,data);
    });

  };

  var handleUserMedia = function(stream) {
    console.log('Adding local stream.');
    localVideo.src = window.URL.createObjectURL(stream);
    localStream = stream;
    channel.send('message', 'MEDIA');
    if (STATUS.INIT) {
      maybeStart();
    }
  };

  var handleUserMediaError = function(error){
    console.log('getUserMedia error: ', error);
  };

  window.XWebRTC = XWebRTC;

})();
