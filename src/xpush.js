(function(){

  var XPush = (function() {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      http = require('http');
      io = require('socket.io-client');
    }

    var SESSION = 'session';
    var CHANNEL = 'channel';

    var ST = {A:'app',C:'channel',U:'userId',US:'users',D:'deviceId',N:'notiId',S:'server'
    ,MG:'message',NM:'name',PW:'password',GR:'groups',DT:'datas',MD:'mode',TS:'timestamp'
    ,SS:'socketId',CD:'createDate',UD:'updateDate'};

    var socketOptions ={
      transports: ['websocket']
      ,'force new connection': true
    };

    var oldDebug;
    var debug = function() {
    };
    
    /**
     * Constructor of Xpush
     * @module Xpush
     * @constructor
     * @param {string} host - address of session server to connect
     * @param {string} appId - application id
     * @param {string} [eventHandler] - a function for processing the session event
     * @param {boolean} [autoInitFlag] - flag for whether to automatically initialize
     * @example
     * // Create new Xpush Object
     * var xpush = new Xpush( 'http://demo.stalk.io:8000', 'sample' );
     * @example
     * // Create new Xpush Object with event Handler
     * var xpush = new Xpush( 'http://demo.stalk.io:8000', 'sample', function (type, data){
     *   console.log( " type : ", type );
     *   console.log( " data : ", data );
     * });
     */
    var XPush = function(host, appId, eventHandler, autoInitFlag){
      if(!host){alert('params(1) must have hostname'); return;}
      if(!appId){alert('params(2) must have appId'); return;}
      var self = this;
      self.appId = appId;       // applicationKey
      self._channels = {};      // channel List

      //self.initStatus;        // manage async problem
      self.headers = {};        // request header
      //self.liveSockets = {};  // ch : Connection
      self._sessionConnection;
      self.maxConnection = 5;
      self.maxTimeout = 30000;
      self.channelNameList = [];
      self.hostname = host;
      self.receiveMessageStack = [];
      self.isExistUnread = true;
      self.autoInitFlag = true;
      self._userEventNames = [];

      if( autoInitFlag !=undefined ){
        self.autoInitFlag = autoInitFlag;
      }

      self.on('newChannel',function(data){
        self.channelNameList.push( data.chNm );
      }, true);

      if(eventHandler){
        self._isEventHandler = true;
        self.on('___session_event', eventHandler);
      }
      return self;
    };

    XPush.Context = {
      SIGNUP : '/user/register',
      LOGIN : '/auth',
      Channel : '/channel',
      Signout : '/signout',
      Message : '/msg',
      NODE : '/node'
    };

    /**
     * enable debugging
     * @name enableDebug
     * @memberof Xpush
     * @function
     * @example
     * // enable debug
     * xpush.enableDebug();
     */
    XPush.prototype.enableDebug = function(){
      if( oldDebug ){
        return;
      }

      if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        debug = Function.prototype.bind.call(console.log, console);
      } else {
        if (window.console) {
          if (Function.prototype.bind) {
            debug = Function.prototype.bind.call(console.log, console);
          } else {
            debug = function() {
              Function.prototype.apply.call(console.log, console, arguments);
            };
          }
        }
      }
    };

    /**
     * disable debugging
     * @name disableDebug
     * @memberof Xpush
     * @function
     * @example
     * // disable debug
     * xpush.disableDebug();
     */
    XPush.prototype.disableDebug = function(){
      // Init debug funciton
      debug = function(){
      };

      oldDebug = undefined;
    };

    /**
     * Register user using the userId and password.
     * @name signup
     * @memberof Xpush
     * @function
     * @param {string} userId - User Id
     * @param {string} password - Password
     * @param {string} [deviceId=WEB] - Device Id
     * @param {callback} cb - callback function to be performed after register
     * @example
     * // Add new user
     * xpush.signup( 'james', '1234', function(err,data){
     *   console.log('register success : ' + data);
     * }); 
     */
    XPush.prototype.signup = function(userId, password, deviceId, cb){
      var self = this;

      if(typeof(deviceId) == 'function' && !cb){
        cb = deviceId;
        deviceId = 'WEB';
      }

      var sendData = {A:self.appId , U: userId, PW: password, D: deviceId};
      self.ajax( XPush.Context.SIGNUP , 'POST', sendData, cb);
    };

    /**
     * Login user using the userId and password.
     * @name login
     * @memberof Xpush
     * @function
     * @param {string} userId - User Id
     * @param {string} password - Password
     * @param {string} [deviceId=WEB] - Device Id
     * @param {string} [mode] - mode
     * @param {callback} cb - callback function to be performed after login
     * @example
     * 
     * xpush.login( 'james', '1234', function(err,data){
     *   console.log('register success : ', data);
     * });
     * @example
     * // login with deviceId
     * xpush.login( 'james', '1234', 'android', function(err,data){
     *   console.log('login success : ', data);
     * });
     */
    XPush.prototype.login = function(userId, password, deviceId, mode, cb){
      var self = this;

      if(typeof(deviceId) == 'function' && !mode && !cb){
        cb = deviceId;
        deviceId = 'WEB';
      }

      if(typeof(mode) == 'function' && !cb){
        cb = mode;
        mode = undefined;
      }

      self.userId = userId;
      self.deviceId = deviceId;
      var sendData = {A: self.appId, U: userId, PW: password, D: deviceId};
      if(mode) sendData.MD = mode;

      self.ajax( XPush.Context.LOGIN , 'POST', sendData, function(err, result){

        if(err){
          if(cb) cb(err, result);
          return;
        }

        if(result.status == 'ok'){
          // result.result = {"token":"HS6pNwzBoK","server":"215","serverUrl":"http://www.notdol.com:9990"};
          var c = self._sessionConnection = new Connection(self, SESSION, result.result);

          c.connect(function(){
            debug("xpush : login end", self.userId);
            self._initSessionSocket(self._sessionConnection._socket, function(){
              if(cb) cb(result.message, result.result); // @ TODO from yohan.
            });
          });
        }else{
          if(cb) cb(result.message);
          alert('xpush : login error'+ result.message);
        }
      });
    };

    /**
     * Set the userId and deviceId to current xpush object. only if the session socket is already connected
     * @name setSessionInfo
     * @memberof Xpush
     * @function
     * @param {string} userId - User Id
     * @param {string} [deviceId] - Device Id
     * @param {callback} cb - callback function to be performed after set
     * @example
     * // Set session info
     * xpush.setSessionInfo( 'james', function(){} );
     * @example
     * // Set session info with deviceId
     * xpush.setSessionInfo( 'james', 'WEB', function(){} );
     */
    XPush.prototype.setSessionInfo = function(userId, deviceId, cb){
      var self = this;

      if(typeof(deviceId) == 'function' && !cb){
        cb = deviceId;
        deviceId = 'WEB';
      }

      self.userId = userId;
      self.deviceId = deviceId;

      cb();
    };

    /**
     * Disconnect the session socket and channel socket.
     * @name logout
     * @memberof Xpush
     * @function
     * @example
     * // logout
     * xpush.logout();
     */
    XPush.prototype.logout = function(){
      var self = this;
      if( self != undefined ) {

        // Disconnect session connection
        if( self._sessionConnection != undefined  ){
          self._sessionConnection.disconnect();
        }

        // Disconnect channel connections
        if( self._channels != undefined  ){
          for( var key in self._channels ){
            if( self._channels[key]._connected ){
              self._channels[key].disconnect();
            }
          }
        }
      }      
    };

    /**
     * Generates a new channel.
     * @name createChannel
     * @memberof Xpush
     * @function
     * @param {string} users - userId array to invite channel
     * @param {string} [channel] - Channel Id
     * @param {Object} [datas] - JSON for additional channel information
     * @param {callback} cb - callback function to be performed after generate
     * @example
     * // create random channel without data
     * xpush.createChannel(['james', 'notdol'], function(err, data){
     *   console.log( 'create channel success : ', data);
     * });
     * @example
     * // create a channel without data
     * xpush.createChannel(['james'], 'channel02', function(err,data){
     *   console.log( 'create channel success : ', data);
     * });
     * @example
     * // create a channel with data
     * xpush.createChannel(['james'], 'channel03', {'NM':'james'}, function(err,data){
     *   console.log( 'create channel success : ', data);
     * });
     */
    XPush.prototype.createChannel = function(users, channel, datas, cb){
      var self = this;
      var channels = self._channels;

      if( arguments.length === 3 ){
        // users, channel, cb
        if( typeof(arguments[1]) == 'string' && typeof(arguments[2]) == 'function' ){
          cb = datas;
          datas = {};
        } else if ( typeof(arguments[1]) == 'object' && typeof(arguments[2]) == 'function' ){
          cb = datas;
          datas = channel;
          channel = undefined;
        }
      } else if(typeof(channel) == 'function' && !datas && !cb){
        cb = channel; channel = undefined; datas = {};
      }

      var newChannel;
      var channelNm = channel;

      //Add logined user if not in users
      if( users.indexOf(self.userId) < 0 ){
        users.push(self.userId);
      }

      self.sEmit('channel-create',{C: channel, U: users, DT:datas},function(err, result){
        //_id: "53b039e6a2f41316d7046732"
        //app: "stalk-io"
        //channel: "b14qQ6wI"
        //created: "2014-06-29T16:08:06.684Z"
        if(err && err != 'WARN-EXISTED') {
          if(cb){
            cb(err, result);
          }
        }
        channelNm = result.C || channelNm;
        self._getChannelInfo(channelNm,function(err,data){
          //channel , seq, server.channel,name,url

          if(err){
            debug(" == node channel " ,err);
          }else if ( data.status == 'ok'){
            newChannel.setServerInfo(data.result);
            //newChannel.chNm = channelNm;
            channels[channelNm] = newChannel;
            //if(oldChNm){
            //  delete channels[oldChNm];
            //}
            if(cb)cb(null, channelNm);
          }
        });
      });
      newChannel = self._makeChannel(channelNm);
      return newChannel;
    };

    /**
     * Generate a new `CHANNEL_ONLY` channel.
     * @name createSimpleChannel
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {Object} [userObj] - UserObject( U : userID, D : deviceId )
     * @param {callback} cb - callback function to be performed after generate
     * @example
     * // create simple channel without userObject
     * xpush.createSimpleChannel('channel01', function(){
     *   console.log( 'create simple channel success' );
     * });
     * @example
     * // create simple channel with userObject
     * xpush.createSimpleChannel('channel02', {'U':'james','D':'WEB'}, function(){
     *   console.log( 'create simple channel success' );
     * });
     */
    XPush.prototype.createSimpleChannel = function(channel, userObj, cb){
      var self = this;

      var ch = self._makeChannel(channel);
      self._getChannelInfo(channel,function(err,data){
        if(err){
          debug(" == node channel " ,err);
          if(cb) cb(err);
        }else if ( data.status == 'ok'){

          if( typeof(userObj) == 'function' && !cb ){
            cb = userObj; userObj = undefined;
          }

          if(userObj){
            self.userId = userObj.U || 'someone';
            self.deviceId = userObj.D || 'WEB';
          }else {
            self.userId = 'someone';
            self.deviceId = 'WEB';
          }

          ch.info = data.result;
          ch._server = {serverUrl : data.result.server.url};
          ch.chNm = data.result.channel;

          ch.connect(function(){
            if(cb) cb();
          }, 'CHANNEL_ONLY');
        }
      });
      return ch;
    };

    /**
     * Query the channel list from the server.
     * @name getChannels
     * @memberof Xpush
     * @function
     * @param {callback} cb - callback function to be performed after query
     * @example
     * // Get channels
     * xpush.getChannels(function(err,datas){
     *   console.log( 'channels : ' + datas );
     * });
     */
    XPush.prototype.getChannels = function(cb){
      var self = this;
      debug("xpush : getChannels ",self.userId);
      self.sEmit('channel-list',function(err, result){
        //app(A), channel(C), created(CD) , users(US)
        debug("xpush : getChannels end ",result);
        ['A','C','CD','US'].forEach(function(item){
          UTILS.changeKey(result,item);
        });
        if(result.length > 0){
          result.forEach(function(r){
            ['D','N','U'].forEach(function(item){
              UTILS.changeKey(r.users,item);
            });
          });
        }
        cb(err,result);
      });
    };

    /**
     * Modify the channel information of the server.
     * @name updateChannel
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {Object} query - mongo DB query form as a JSON
     * @param {callback} cb - callback function to be performed after modify
     * // update channel
     * @example
     * xpush.updateChannel( 'channel02', { $set:{'DT':{'NM':'notdol1'}}}, function(err, result){
     *   console.log( 'result : ', result );
     * });
     */
    XPush.prototype.updateChannel = function(channel, query, cb){
      var self = this;
      var param = { 'A': self.appId, 'C': channel, 'Q' : query };
      self.sEmit('channel-update', param, function(err, result){
        //app(A), channel(C), created(CD) , users(US)
        debug("xpush : channel-update end ",result);
        cb(err,result);
      });
    };

    /**
     * The channel list where the user is connected to the current channel will be viewed in redis.
     * @name getChannelsActive
     * @memberof Xpush
     * @function
     * @param {Object} data - ( 'key': '' )
     * @param {callback} cb - callback function to be performed after retrieve
     * @example
     * // Retrieve channels that start with channel
     * xpush.getChannelsActive( {'key':'channel*'}, function(results){
     *   console.log( 'results : ', results );
     * });
     */
    XPush.prototype.getChannelsActive = function(data, cb){ //data.key(option)
      var self = this;
      self.sEmit('channel-list-active',data, function(err, result){
        //app, channel, created
        cb(err, result);
      });
    };

    /**
     * Get the current channel information in xpush object.
     * @name getChannel
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @return {Object} return Channel Object
     * @example
     * var channel01 = xpush.getChannel('channel01');
     */
    XPush.prototype.getChannel = function(channel){
      var self = this;
      var channels = self._channels;
      for(var k in channels){
        if(k == channel) return channels[k];
      }

      return undefined;
    };

    /**
     * Query the channel information of the server.
     * @name getChannelData
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {callback} cb - callback function to be performed after query
     * @example
     * xpush.getChannelData( channel, function(err,data){
     *   console.log( 'retrieve channel success : ', data);
     * });
     */
    XPush.prototype.getChannelData = function(channel, cb){
      var self = this;
      self.sEmit('channel-get', {C: channel, U: /*userId*/{} }, function(err, result){
        if(cb) cb(err,result);
      });
    };

    /**
     * Join to the channel.
     * @name joinChannel
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {Object} param - JSON Data ( U, DT )
     * @param {callback} cb - callback function to be performed after join
     * @example
     * xpush.joinChannel( 'channel03', {'U':['notdol']}, function(result){
     *   console.log( 'result : ', result);
     * });
     */
    XPush.prototype.joinChannel = function(channel, param, cb){
      var self = this;
      self.getChannelAsync(channel, function (err, ch){
        ch.joinChannel( param, function( data ){
          cb( data );
        });
      });
    };

    /**
     * Exit from the channel
     * @name exitChannel
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {callback} cb - callback function to be performed after exit
     * @example
     * xpush.exitChannel( 'channel03', function(err, result){
     *   console.log( 'result : ', result);
     * });
     */
    XPush.prototype.exitChannel = function(channel, cb){
      var self = this;
      self.sEmit('channel-exit', {C: channel}, function(err, result){
        if(cb) cb(err,result);
      });
    };

    /**
     * Bring the channel information asynchronously. If the channel information is not present in the object, it queries the channel information from the server.
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {callback} cb - callback function to be performed after get
     * @example
     * xpush.getChannelAsync( 'channel03', function(err, result){
     *   console.log( 'result : ', result);
     * });
     */
    XPush.prototype.getChannelAsync = function(channel, cb){
      var self = this;
      var ch = self.getChannel(channel);
      if(!ch){
        self._channels[channel] = ch;
        ch = self._makeChannel(channel);
        self._getChannelInfo(channel,function(err,data){
          if(err){
            debug(" == node channel " ,err);
            cb(err);
          }else if ( data.status == 'ok'){
            ch.setServerInfo(data.result, function(){
              cb(false, ch);
            });
          }
        });
      }else{
        cb(false, ch);
      }
    };

    /**
     * Upload the file DOM object using the socket stream to 
     * @name uploadStream
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {Object} inputObj - JSON Objec( 'file' : file DOM Oject for upload, 'type' : '' )
     * @param {function} fnPrg - function to show the upload progress
     * @param {callback} fnCallback - callback function to be performed after upload
     * @example
     * var fileObj = document.getElementById('file');
     * xpush.uploadStream( 'channel03', {
     *   file: fileObj
     * }, function(data, idx){
     *   console.log( 'progress : ' + data );
     * }, function(data,idx){
     *   console.log( 'upload result : ' + data );
     * });
     */
    XPush.prototype.uploadStream = function(channel, inputObj, fnPrg, fnCallback){
      var self = this;

      self.getChannelAsync(channel, function (err, ch){

        var blobs   = [];
        var streams = [];

        for(var i=0; i<inputObj.file.files.length; i++){
          var file   = inputObj.file.files[i];
          var bufferSize = 128;

          // larger than 1M
          if( file.size > ( 1024 * 1024 ) ){
            bufferSize = 256;
          } else if ( file.size > ( 4 * 1024 * 1024 ) ){
            bufferSize = 512;
          }
          
          var size   = 0;
          streams[i] = ss.createStream({highWaterMark: bufferSize * 1024});
          blobs[i]   = ss.createBlobReadStream(file, {highWaterMark: bufferSize * 1024});

          blobs[i].on('data', function(chunk) {
            size += chunk.length;
            fnPrg(Math.floor(size / file.size * 100), i);
          });

          var _data = {};
          _data.orgName = file.name;
          if(inputObj.overwrite) _data.name = file.name;
          if(inputObj.type)      _data.type = inputObj.type;

          ch.upload(streams[i], _data, function(result){
            fnCallback(result, i);
          });
          blobs[i].pipe(streams[i]);
        }

      });
    };

    /**
     * Upload files using the REST API because the mobile is not supported file dom object
     * @name uploadFile
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {string} fileUri - fileUri to upload
     * @param {Object} inputObj - JSON Objec( 'type' : '', 'name' : Original File name )
     * @param {function} fnPrg - function to show the upload progress
     * @param {callback} fnCallback - callback function to be performed after upload
     * @example
     * xpush.uploadFile('channelId', 'content://media/external/images/media/636',
     * {type : 'image', name:'image.png' },
     * function ( data ){
     *   console.log( data );
     * },
     * function (data){
     *   console.log( data.response );
     * });
     */
    XPush.prototype.uploadFile = function(channel, fileUri, inputObj, fnPrg, fnCallback){
      var self = this;

      self.getChannelAsync(channel, function(err, ch){

        if(window.FileTransfer && window.FileUploadOptions){

          var url = ch._server.serverUrl+'/upload';

          var options = new FileUploadOptions();
          options.fileKey="post";
          options.chunkedMode = false;
          options.params = {
            'key1': 'VAL1',
            'key2': 'VAL2'
          };
          options.headers = {
            'XP-A': self.appId,
            'XP-C': channel,
            'XP-U': JSON.stringify({
              U: self.userId,
              D: self.deviceId
            }) //[U]^[D]^[TK] @ TODO add user token
          };
          options.headers['XP-FU-org'] = inputObj.name;
          if(inputObj.overwrite) options.headers['XP-FU-nm'] = inputObj.name;
          if(inputObj.type)      options.headers['XP-FU-tp'] = inputObj.type;

          var ft = new FileTransfer();
          if( fnPrg != undefined ){
            ft.onprogress = function(progressEvent) {
              if (progressEvent.lengthComputable) {
                var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
                fnPrg( perc);
              }
            };
          }

          ft.upload(fileUri, encodeURI(url), function(data){
            fnCallback(data);
            //$scope.picData = FILE_URI;
            //$scope.$apply();
          }, function(e) {
              debug("On fail " + e);
          }, options);

        }

      });
    };

    /**
     * Get the file url which is uploaded completely
     * @name getFileUrl
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {string} fileName - received return name after file uploading 
     * @return {string} url where you can download the file
     * @example
     * var url = xpush.getFileUrl( 'channel03', data.result.name )
     */
    XPush.prototype.getFileUrl = function(channel, fileName){

      var self = this;
      var ch = self.getChannel(channel);

      var result = ch.info.server.url +
        '/download/' +
        ch._xpush.appId +
        '/'+ch.info.channel +
        '/'+ch._xpush.userId +
        '/'+ch._socket.io.engine.id +
        '/'+fileName;

      return result;
    };

    /**
     * If the channel is a connection object and returns a channel connection, otherwise create a new `Connection`.
     * @private
     * @function
     * @param {string} channel - Channel Id
     * @return {Connection} Connect Object
     */
    XPush.prototype._makeChannel = function(channel){
      var self = this;
      debug('xpush : connection _makeChannel ',channel);
      for( var key in self._channels ){
        if( key == channel && self._channels[key] != undefined && self._channels[key]._connected ){
          return self._channels[key];
        }
      }

      var ch = new Connection(self,CHANNEL);
      if(channel) {
        ch.channel = channel;
        self._channels[channel] = ch;
      }
      return ch;
    };

    XPush.prototype.calcChannel = function(ch){
      var self = this;
      if(self._channels.length >= self.maxConnection){
        self._deleteChannel(self._channels[self._channels.length-1]);
      }
      /*
      if(ch){
        if(self._channels[0] != ch){
          for(var i  = 1 ; i < self._channels.length ; i++){
            if( self._channels[i] == ch){
              self._channels.unshift( self._channels.splice(i,1));
            }
          }
        }
      }
      */
    };

    /**
     * Disconnect the channel socket, connection objects are deleted from managed list.
     * @private
     * @function
     * @param {Object} channel - Channel Id
     */
    XPush.prototype._deleteChannel = function(channelObject){
      var self = this;
      for(var k in self._channels){
        if(self._channels[k] == channelObject){
          self._channels[k].disconnect();
          delete self._channels[k];
          break;
        }
      }
    };

    /**
     * confirm whether channel is exist or not
     * @name isExistChannel
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @return {boolean}
     * @example
     * var isExist = xpush.isExistChannel('channel03');
     */
    XPush.prototype.isExistChannel = function(channel){
      var self = this;
      for(var i = 0 ; i < self.channelNameList.length ; i++){
        if(self.channelNameList[i] == channel){
          return true;
        }
      }
      return false;
    };

    /**
     * Query the user list from the server.
     * @name getUserList
     * @memberof Xpush
     * @function
     * @param {Object} [params] - param for search user.
     * @param {function} cb - callback function to be performed after query
     * @example
     * xpush.getUserList( {'page':{'num':1,'size':10} },function(err, users){
     *   console.log( users );
     * });
     */
    XPush.prototype.getUserList = function(params,  cb){
      if(typeof(params) == 'function'){
        cb = params;
        params = {};
      }
      params = params == undefined ? {}: params;
      var self = this;
      debug("xpush : getUsertList ",params);
      self.sEmit('user-list' , params, function(err, result){
        if(cb) cb(err, result.users, result.count);
      });
    };

    /**
     * Query the user list from the server. Paging is possible.
     * @name queryUser
     * @memberof Xpush
     * @function
     * @param {Object} _params - ( query, column )
     * @param {callback} cb - callback function to be performed after query
     * @example
     * var param = {query : {'DT.NM':'james'}, column: { U: 1, DT: 1, _id: 0 } };
     * xpush.queryUser( param, function( err, userArray, count ){
     *   console.log( userArray );
     * });
     */
    XPush.prototype.queryUser = function(_params,  cb){

      var self = this;

      if(!_params.query) {
        console.error('Query User', 'query is not existed.');
      };
      if(!_params.column) {
        console.error('Query User', 'column is not existed.');
      };

      var params = {
        query : _params.query,
        column: _params.column
      };

      if(_params.options) {
        params['options'] = _params.options;
      } else {
        params['options'] = {};
      }

      debug("xpush : queryUser ",params);

      self.sEmit('user-query' , params, function(err, result){
        if(cb) cb(err, result.users, result.count);
      });
    };

    /**
     * Transmits the data.
     * @name send
     * @memberof Xpush
     * @function
     * @param {string} channel - Channel Id
     * @param {string} name - EventName
     * @param {Object} data - String or JSON object to Send
     * @example
     * xpush.send( 'ch01', 'message', {'MG':'Hello world'} );
     */
    XPush.prototype.send = function(channel, name, data){
      var self = this;

      self.getChannelAsync(channel, function (err, ch){
        ch.send(name,data);
      });
    };

    /**
     * Query the unread server message.
     * After inquiry, call the `message-received` API to delete the viewed message.
     * @name getUnreadMessage
     * @memberof Xpush
     * @function
     * @param {callback} cb - callback function to be performed after query
     * @example
     * xpush.getUnreadMessage( function(err, result){
     *   console.log( result );
     * });
     */
    XPush.prototype.getUnreadMessage = function(cb){
      var self = this;
      debug("xpush : getUnreadMessage ",self.userId);
      self.sEmit('message-unread',function(err, result){
        //app, channel, created
        debug("xpush : getUnreadMessage end ", result);
        if(result && result.length > 0){
          result.sort(UTILS.messageTimeSort);
        }
        self.isExistUnread = false;
        self.sEmit('message-received');
        cb(err, result);
      });
    };

    /**
     * Get the channel server information to connect
     * @private
     * @function
     * @param {string} channel - Channel Id
     * @param {callback} cb - callback function to be performed after get
     */
    XPush.prototype._getChannelInfo = function(channel, cb){
      var self = this;
      debug("xpush : _getChannelInfo ",channel);
      self.ajax( XPush.Context.NODE+'/'+self.appId+'/'+channel , 'GET', {}, cb);
    };

    /**
     * Query the user list on the server that contains the group.
     * @name getGroupUsers
     * @memberof Xpush
     * @function
     * @param {string} groupId - Find groupId
     * @param {callback} cb - callback function to be performed after query
     * @example
     * xpush.getGroupUsers( 'james', function( err, users ){
     *   console.log( users );
     * )};
     */
    XPush.prototype.getGroupUsers = function(groupId,cb){
      var self = this;
    if(typeof(arguments[0]) == 'function') {cb = arguments[0]; groupId = undefined;}
      groupId = groupId ? groupId : self.userId;
      self.sEmit('group-list',{'GR': groupId}, function(err,result){
        cb(err,result);
      });
    };

    /**
     * Add a group id to one or multiple users.
     * @name addUserToGroup
     * @memberof Xpush
     * @function
     * @param {string} [groupId] - userId
     * @param {array} userIds - users array to add
     * @param {callback} cb - callback function to be performed after add
     * @example
     * xpush.addUserToGroup( 'james', ['notdol','john'], function( err, result ){
     *   console.log( result );
     * )};
     */
    XPush.prototype.addUserToGroup = function(groupId, userIds, cb){
      var self = this;
      if(typeof(arguments[1]) == 'function') {cb = arguments[1]; userIds = groupId; groupId = undefined;}
      groupId = groupId ? groupId : self.userId;
      userIds = userIds ? userIds : [];
      self.sEmit('group-add',{'GR': groupId, 'U': userIds}, function(err,result){
        //app, channel, created
        cb(err,result);
      });
    };

    /**
     * Delete the user from the group.
     * @name removeUserFromGroup
     * @memberof Xpush
     * @function
     * @param {string} [groupId] - userId
     * @param {string} userId - user's ID to delete
     * @param {callback} cb - callback function to be performed after delete
     * @example
     * xpush.removeUserFromGroup( 'james', 'notdol', function( err, result ){
     *   console.log( result );
     * )};
     */
    XPush.prototype.removeUserFromGroup = function(groupId, userId, cb){
      var self = this;
      if(typeof(arguments[1]) == 'function') {cb = arguments[1]; userId = groupId; groupId = undefined;}
      groupId = groupId ? groupId : self.userId;

      self.sEmit('group-remove',{'GR': groupId, 'U': userId}, function(err, result){
        cb(err,result);
      });
    };

    /**
    XPush.prototype.getGroups = function(){
      // not defined yet
    };

    XPush.prototype.signout = function(cb){
      //session end
      var self = this;
      var sendData = { };
      self.ajax( XPush.Context.Signout , 'POST', sendData, cb);
    };
    */

    /**
     * Add an event after the session socket initialization. if it is `autoInitFlag` true, get the channel information and the unread message.
     * @private
     * @function
     * @param {Object} socket.io
     * @param {callback} cb - callback function to be performed after init
     */
    XPush.prototype._initSessionSocket = function(socket,cb){
      var self = this;
      socket.on('_event',function(data){
        debug('xpush : session receive ', data.event, data.C,data.NM,data.DT, self.userId);
        // data.event = NOTIFICATION
        // channel,name, timestamp, data= {}
        switch(data.event){
          case 'NOTIFICATION':
            var ch = self.getChannel(data.C);

            // if `autoInitFlag` is true, make channel automatically
            if( self.autoInitFlag ){
              if(!ch){
                ch = self._makeChannel(data.C);

                self._getChannelInfo(data.C,function(err,data){

                  if(err){
                    debug(" == node channel " ,err);
                  }else if ( data.status == 'ok'){
                    ch.setServerInfo(data.result);
                  }
                });
                //self.emit('channel-created', {ch: ch, chNm: data.channel});
                if(!self.isExistChannel(data.channel)) {
                  self.emit('newChannel', ch);
                }
              }
              ch.emit(data.NM , data.DT);
            }
            self.emit(data.NM, data.C, data.NM, data.DT);
          break;

          case 'CONNECT' :
            self.emit('___session_event', 'SESSION', data);
          break;

          case 'DISCONNECT' :
            self.emit('___session_event', 'SESSION', data);
          break;

          case 'LOGOUT' :
            self.emit('___session_event', 'LOGOUT', data);
          break;
        }

      });

      socket.on('channel',function(data){
        debug('xpush : session receive ', 'channel', data, self.userId);

        switch(data.event){
          case 'UPDATE':
        // event: update , app,channel,server,count
          break;

          case 'REMOVE' :
        // event: remove , app,channel
          break;
        }
      });

      socket.on('connected',function(){
        debug('xpush : session receive ', CHANNEL, arguments, self.userId);
      });

      // if `autoInitFlag` is true, get channels
      if( self.autoInitFlag ){
        self.getChannels(function(err,data){
          self.channelNameList = data;
          self.getUnreadMessage(function(err, data){
            if(data && data.length > 0 ){
              for(var i = data.length-1 ; i >= 0; i--){

                data[i].MG.DT = JSON.parse(data[i].MG.DT);
                self.receiveMessageStack.unshift([data[i].NM,  data[i].MG.DT.C, data[i].NM,  data[i].MG.DT]);
              }
              self.isExistUnread = false;
              while(self.receiveMessageStack.length > 0 ){
                var t = self.receiveMessageStack.shift();
                self.emit.apply(self, t );
              }
              if(cb) cb();
            }else{
              if(cb) cb();
            }
          });
        });
      } else {
        if(cb) cb();
      }

      socket.on('disconnect',function(){
        self.isExistUnread = true;
      });
    };

    var _rest = function( context, method, data, headers, cb){
      var self = this;

      if(typeof(headers) == 'function' && !cb){
        cb = headers;
        headers = undefined;
      }

      var hostname = self.hostname.replace( "http://", "" );
      if( hostname.indexOf( ":" ) > 0 ) hostname = hostname.split(":")[0];

      var options = {
        host: hostname,
        port:8000,
        path: context,
        method: method
      };

      if( headers ){
        options.headers = headers;
      } else {
         options.headers = {};
      }

      options.headers['Content-Type'] = 'application/json';      

      var result = '';
      var request = http.request( options, function(res) {

        res.setEncoding('utf8');
        res.on("data", function(chunk) {    
          result = result + chunk;      
        });

        res.on("end", function() {
          var r = JSON.parse(result);
          if(r.status != 'ok'){
            cb(r.status,r.message);
          }else{
            cb(null,r);
          }  
        });

      }).on('error', function(e) {
        debug("ajax error: " + e.message);
        cb('',result);
      });
      
      if( method.toLowerCase() !== 'GET'.toLowerCase() ){
        request.write(JSON.stringify(data));
      }
      request.end();
    }

    var _ajax = function( context, method, data, headers, cb){
      var self = this;

      if(typeof(headers) == 'function' && !cb){
        cb = headers;
        headers = false;
      }

      var xhr;
      try{
        xhr = new XMLHttpRequest();
      }catch (e){
        try{
          xhr = new XDomainRequest();
        } catch (e){
          try{
            xhr = new ActiveXObject('Msxml2.XMLHTTP');
          }catch (e){
            try{
              xhr = new ActiveXObject('Microsoft.XMLHTTP');
            }catch (e){
              console.error('\nYour browser is not compatible with XPUSH AJAX');
            }
          }
        }
      }

      var _url = self.hostname+context;

      var param = Object.keys(data).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
      }).join('&');

      method = (method.toLowerCase() == "get") ? "GET":"POST";
      param  = (param == null || param == "") ? null : param;
      if(method == "GET" && param != null){
        _url = _url + "?" + param;
      }

      xhr.open(method, _url, true);
      xhr.onreadystatechange = function() {

        if(xhr.readyState < 4) {
          return;
        }

        if(xhr.status !== 200) {
          debug("xpush : ajax error", self.hostname+context,param);
          cb(xhr.status,{});
        }

        if(xhr.readyState === 4) {
          var r = JSON.parse(xhr.responseText);
          if(r.status != 'ok'){
            cb(r.status,r.message);
          }else{
            cb(null,r);
          }
        }
      };

      debug("xpush : ajax ", self.hostname+context,method,param);

      if(headers) {
        for (var key in headers) {
          if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        }
      }
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send( (method == "POST") ? param : null);

      return;
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
      XPush.prototype.ajax = _rest;
    } else {
      XPush.prototype.ajax = _ajax;
    }

    /**
     * Generate an event by using the session socket.
     * @private
     * @function
     * @param {string} socket의 event key
     * @param {Object} [params] - object to send
     * @param {callback} cb - callback function to be performed after event occured
     */
    XPush.prototype.sEmit = function(key, params, cb){
      var self = this;

      var returnFunction = function(result){

        if(result.status == 'ok'){
          cb(null, result.result);
        }else{
          if(result.status.indexOf('WARN') == 0){
            debug("xpush : ", key, result.status, result.message);
          }else{
            debug("xpush : ", key, result.status, result.message);
          }
          cb(result.status, result.message);
        }
      };

      if( typeof(arguments[1]) == 'function' ){
        cb = params;
        self._sessionConnection._socket.emit(key, returnFunction);
      }else{
        self._sessionConnection._socket.emit(key, params, returnFunction);
      }
      return;
    };

    /**
     * Register the event and function to the event stack. The specified function is event is called the event.
     * @name on
     * @memberof Xpush
     * @function
     * @param {string} event key
     * @param {function} function
     * @example
     * xpush.on( 'message', function(channel, name, data){
     *   console.log( channel, name, data );
     * });
     */
    XPush.prototype.on = function(event, fct, systemFlag){
      var self = this;

      if( !systemFlag ){
        self._userEventNames.push( event );
      }

      self._events = self._events || {};
      self._events[event] = self._events[event] || [];
      self._events[event].push(fct);

      if( self._sessionConnection ){
        self._sessionConnection.attchOnEvent( event );
      }

      for ( var key in self._channels ){
        self._channels[key].attchOnEvent( event );
      }
    };

    /**
     * Removes the event and function in the event stack 
     * @name off
     * @memberof Xpush
     * @function
     * @param {string} event key
     * @param {function} function
     * @example
     * xpush.off( 'message', function(channel, name, data){
     *   console.log( channel, name, data );
     * });
     */
    XPush.prototype.off = function(event, fct){
      var self = this;
      self._events = self._events || {};
      if( event in self._events === false  )  return;
      self._events[event].splice(self._events[event].indexOf(fct), 1);
    };

    /**
     * Remove all event on the event stack.
     * @name off
     * @memberof Xpush
     * @function
     * @param {string} event key
     * @param {function} function
     * @example
     * xpush.clearEvent();
     */
    XPush.prototype.clearEvent = function(){
      var self = this;
      var sessionEvent = self._events['___session_event'];
      self._events = {};
      self._events['___session_event'] = sessionEvent;
      self._userEventNames = [];
    };

    /**
     * Call a function that is registered in the event stack.
     * When unread message exists, message will be stacked without causing the function of that event soon because it is being initialized status.
     * @private
     * @memberof Xpush
     * @function
     * @param {string} event key
     */
    XPush.prototype.emit = function(event){
      var self = this;
      if(self.isExistUnread) {
        self.receiveMessageStack.push(arguments);
      }else{
        self._events = self._events || {};
        if( event in self._events === false  )  return;
        for(var i = 0; i < self._events[event].length; i++){
          debug("xpush : test ",arguments);
          self._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
      }
    };

    /**
     * Represents a Connection
     * @module Connection
     * @constructor
     * @param {Xpush} Object - Xpush obejct
     * @param {string} type - 'session' or channel'
     * @param {string} server - Server Url to connect
     */
    var Connection = function(xpush , type, server){

      this._xpush = xpush;
      this._server = server;
      this._type = type;
      if(this._type == SESSION){
        this.chNm = SESSION;
      }
      this._socketStatus; // disconnected, connected
      this._socket;
      this.checkTimer;
      this.info;
      this.messageStack = [];
      this.isFirtConnect = true;
      this._connected = false;
      this.timeout = 30000;

      //self.on('received', function(data){
        //self._xpush.calcChannel(self);
      //});
      return this;
    };

    /**
     * Check connectionTimeout
     * @name checkConnectionTimeout
     * @memberof Connection
     * @function
     * @param {string} b - Server Url to connect
     */
    Connection.prototype.checkConnectionTimeout = function(b){
      var self = this;
      if(self.checkTimer) clearTimeout(self.checkTimer);

      if(b){
        self.checkTimer = setTimeout(function(){
          self._socket.disconnect();
        }, self.timeout);
      }
    };

    /**
     * Set server url and connect to the server.
     * @name setServerInfo
     * @memberof Connection
     * @function
     * @param {Object} info - Server Url to connect
     * @param {callback} cb - setServerInfoCallback
     */
    Connection.prototype.setServerInfo = function(info,cb){
      debug("xpush : setServerInfo ", info);
      var self = this;
      self.info = info;
      self._server = {serverUrl : info.server.url};
      self.chNm = info.channel;
      self.connect(function(){
        debug("xpush : setServerInfo end ", arguments,self._xpush.userId, self.chNm);
        //self.connectionCallback();
        if(cb) cb();
      });
    };

    /**
     * Connect to the server.
     * @name setServerInfo
     * @memberof Connection
     * @function
     * @param {callback} cb - connectCallback
     * @param {string} mode - Optional. `CHANANEL_ONLY`
     */
    Connection.prototype.connect = function(cb, mode){
      var self = this;
        var query =
          'A='+self._xpush.appId+'&'+
          'U='+self._xpush.userId+'&'+
          'D='+self._xpush.deviceId+'&'+
          'TK='+self._server.token;
          //'mode=CHANNEL_ONLY';

      if(self._type == CHANNEL){
        query =
          'A='+self._xpush.appId+'&'+
          'C='+self.chNm+'&'+
          'U='+self._xpush.userId+'&'+
          'D='+self._xpush.deviceId+'&'+
          'S='+self.info.server.name;

        if(mode){
          if(mode == 'CHANNEL_ONLY'){
            self._xpush.isExistUnread = false;
          }
          query = query +'&MD='+ mode;
        }
      }

      self._socket = io.connect(self._server.serverUrl+'/'+self._type+'?'+query, socketOptions);

      debug( 'xpush : socketconnect', self._server.serverUrl+'/'+self._type+'?'+query);
      self._socket.on('connect', function(){
        debug( 'channel connection completed' );
        while(self.messageStack.length > 0 ){
          var t = self.messageStack.shift();
          //.self.send(t.NM, t.DT);
          self._socket.emit('send', {NM: t.NM , DT: t.DT});
        }
        self._connected = true;
        if(!self.isFirtConnect) return;
        self.isFirtConnect = false;
        self.connectionCallback(cb);
      });

      self._socket.on('disconnect',function(){
        self._connected = false;
      });
    };

    /**
     * The function is occured when socket is connected.
     * @name connectionCallback
     * @memberof Connection
     * @function
     * @param {callback} cb - connectionCallback
     */
    Connection.prototype.connectionCallback = function(cb){
      var self = this;
      debug("xpush : connection ",'connectionCallback',self._type, self._xpush.userId,self.chNm);

      for( var key in self._xpush._userEventNames ){
        self.attchOnEvent( self._xpush._userEventNames[key] );
      }

      if(self._xpush._isEventHandler) {

        self._socket.on('_event',function(data){

          switch(data.event){
            case 'CONNECTION' :
              self._xpush.emit('___session_event', 'CHANNEL', data);
            break;
            case 'DISCONNECT' :
              self._xpush.emit('___session_event', 'CHANNEL', data);
            break;
          }

        });
      }

      if(cb)cb();
    };

    /**
     * Close the socket connection.
     * @name disconnect
     * @memberof Connection
     * @function
     */
    Connection.prototype.disconnect = function(){
      debug("xpush : socketdisconnect ", this.chNm, this._xpush.userId);
      this._socket.disconnect();
    };

    /**
     * If socket is connected, send data right away,
     * @name send
     * @memberof Connection
     * @param {string} name - Event name
     * @param {object} data - JSON data
     * @param {callback} cb - sendCallback
     * @function
     */
    Connection.prototype.send = function(name, data, cb){
      var self = this;
      if(self._connected){
        self._socket.emit('send', {NM: name , DT: data});
      }else{
        self.messageStack.push({NM: name, DT: data});
      }
    };

    /**
     * If socket is connected, join the channel
     * @name joinChannel
     * @memberof Connection
     * @param {object} data - JSON data
     * @param {callback} cb - joinChannelCallback
     * @function
     */
    Connection.prototype.joinChannel = function(param, cb){
      var self = this;
      if(self._socket.connected){
        self._socket.emit('join', param, function( data ){
          cb( data );
        });
      }
    };

    /**
     * Upload the stream
     * @name upload
     * @memberof Connection
     * @param {object} stream - stream object
     * @param {object} data - file info data ( 'orgName', 'name', 'type')
     * @param {callback} cb - uploadCallback
     * @function
     */
    Connection.prototype.upload = function(stream, data, cb){
      var self = this;
      if(self._socket.connected){
        ss(self._socket).emit('file-upload', stream, data, cb);
      }
    };

    /**
     * Add on event in current socket
     * @name attchOnEvent
     * @memberof Connection
     * @function
     * @param {string} event key
     */
    Connection.prototype.attchOnEvent = function(eventNm){
      var self = this;
      if(self._socket){
        self._socket.on( eventNm ,function(data){
          debug("xpush : channel receive, " +eventNm, self.chNm, data, self._xpush.userId);
          self._xpush.emit(eventNm, self.chNm, eventNm , data);
        });    
      }
    };

    /**
     * Stack the function into event array. The function will excute when an event occur.
     * @name on
     * @memberof Connection
     * @function
     * @param {string} event key
     * @param {function} function
     */
    Connection.prototype.on = function(event, fct){
      var self = this;
      self._events = self._events || {};
      self._events[event] = self._events[event] || [];
      self._events[event].push(fct);
    };

    /**
     * Remove the function at event array
     * @name off
     * @memberof Connection
     * @function
     * @param {string} event key
     * @param {function} function
     */
    Connection.prototype.off = function(event, fct){
      var self = this;
      self._events = self._events || {};
      if( event in self._events === false  )  return;
      self._events[event].splice(self._events[event].indexOf(fct), 1);
    };

    /**
     * Apply the event
     * @name emit
     * @memberof Connection
     * @function
     * @param {string} event key
     */  
    Connection.prototype.emit = function(event /* , args... */){
      var self = this;
      self._events = self._events || {};
      if( event in self._events === false  )  return;
      for(var i = 0; i < self._events[event].length; i++){
        self._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    };

    var UTILS = {};

    UTILS.messageTimeSort = function(a,b){
      // created data
      return a.created > b.created;
    };

    UTILS.changeKey = function(data, key){
      if(data instanceof Array){
        data.forEach(function(d){
          d[ ST[key] ] = d[key];
          delete d[key];
        });
      }else{
        data[ ST[key] ] = data[key];
        delete data[key];
      }
    };

    return XPush;
  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = XPush;
  } else {
    if (typeof define === 'function' && define.amd) {
      define([], function() {
        return XPush;
      });
    } else {
      window.XPush = XPush;
    }
  }
})();
