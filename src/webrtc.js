;(function() {

  var localStream;
  var pc;
  var remoteStream;
  var turnReady;

  var constraints = {video: true};
  var pc_config = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
  var pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};
  var sdpConstraints = {'mandatory': {
    'OfferToReceiveAudio':true,
    'OfferToReceiveVideo':true }};

  var XWebRTC = function(xpush, localVideo, ){

    this._xpush = xpush;
    getUserMedia(constraints, this.handleUserMedia, this.handleUserMediaError);

  };

  XWebRTC.status = {
    READY: false,
    INIT: false,
    STARTED: false
  };

  XWebRTC.prototype.handleUserMedia = function(stream) {
    console.log('Adding local stream.');
    localVideo.src = window.URL.createObjectURL(stream);
    localStream = stream;
    this._xpush.emit('message', 'got user media');
    if (XWebRTC.status.INIT) {
      this.maybeStart();
    }
  };

  XWebRTC.prototype.handleUserMediaError = function(error){
    console.log('getUserMedia error: ', error);
  };

})();
