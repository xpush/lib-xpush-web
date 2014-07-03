;(function() {
  var serverConf = {
  	host: 'http://www.notdol.com',
  	port: 8000
  };

  var socketOptions ={
  	transports: ['websocket']
  	,'force new connection': true
  };

  var RMKEY = 'message';

  var XPush = function(host, appId){
    if(!host){alert('params(1) must have hostname'); return;};
    if(!appId){alert('params(2) must have appId'); return;};
    var self = this;
    self.appId = appId;             // applicationKey
    self._channels = {};      // channel List

    self.initStatus;          // manage async problem
    self.headers = {};        // request header
    self.liveSockets = {}; // ch : Connection
    self._sessionConnection;
    self.maxConnection = 5;
    self.maxTimeout = 30000;
  	self.channelNameList = [];
    self.hostname = host;
    self.receiveMessageStack = [];
    self.isExistUnread = true;

  	self.on('newChannel',function(data){
  		self.channelNameList.push( data.chNm );
  	});
  };

  XPush.Context = {
    SessionServer : '/session', //'/session',
    ChannelServer : '/cs', // /cs/:channel ( header: appKey )
  	SIGNUP : '/user/register',
    LOGIN : '/auth',
    Channel : '/channel', 
    Signout : '/signout',
    Message : '/msg',
    NODE : '/node'
  };

  XPush.prototype.signup = function(userId, password, cb){
    var self = this;
    var sendData = {app:self.appId , userId: userId, password: password, deviceId: 'WEB'};
    self.ajax( XPush.Context.SIGNUP , 'POST', sendData, cb);
  }

  XPush.prototype.login = function(userId, password, cbLogin){
    var self = this;
    self.userId = userId;
    var sendData = {app: self.appId, userId: userId, password: password, deviceId: 'WEB'};
    self.ajax( XPush.Context.LOGIN , 'POST', sendData, function(err, result){
      if(result.status == 'ok'){
        // result.result = {"token":"HS6pNwzBoK","server":"215","serverUrl":"http://www.notdol.com:9990"};
        var c = self._sessionConnection = new Connection(self, 'session', result.result);
  	
    		c.connect(function(){
    			console.log("xpush : login end", self.userId);
    			self.initSessionSocket(self._sessionConnection._socket, cbLogin);
    		});
      }else{
        cb(result.message);
      	alert('xpush : login error'+ result.message);
      }
    });
  }

  // params.channel(option), params.users
  XPush.prototype.createChannel = function(users, channel, cb){
    var self = this;
    var channels = self._channels;

    if(typeof(channel) == 'function' && !cb){
      cb = channel; channel = undefined;
    }
    console.log("xpush : createChannel", users,channel);
    var newChannel;
    var channelNm = channel;
    var oldChNm = channelNm;
    users.push(self.userId);
    self.sEmit('channel-create',{channel: channel, users: users},function(err, result){
      //_id: "53b039e6a2f41316d7046732"
      //app: "stalk-io"
      //channel: "b14qQ6wI"
      //created: "2014-06-29T16:08:06.684Z"i
      console.log("xpush : createChannel end", result);
      channelNm = result.channel;
      self.getChannelInfo(channelNm,function(err,data){
        //channel , seq, server.channel,name,url
        if(err){
          console.log(" == node channel " ,err);
        }else if ( data.status == 'ok'){
          newChannel.setServerInfo(data.result);
          channels[channelNm] = newChannel;
          if(oldChNm){
            delete channels[oldChNm];
          }
          if(cb)cb(null);
        }
      });
    });
    newChannel = self._makeChannel(channelNm);
    return newChannel;
  }

  XPush.prototype.getChannels = function(cb){
   console.log("xpush : getChannels ");
    var self = this;
    self.sEmit('channel-list',function(err, result){
      //app, channel, created 
      console.log("xpush : getChannels end ",result);
      cb(err,result);
    });
  };

  XPush.prototype.getChannelsActive = function(data){ //data.key(option)
    var self = this;
    self.sEmit('channel-list-active',function(err, result){
      //app, channel, created 
      cb(result);
    });
  }

  XPush.prototype.getChannel = function(chNm){
    var self = this;
    var channels = self._channels;

    for(var k in channels){
      if(k == chNm) return channels[k];
    };

    return undefined;
  };

  XPush.prototype.joinChannel = function(chNm, /*userId,*/ cb){
    var self = this;
    self.sEmit('channel-join', {channel: chNm, userId: /*userId*/{} }, function(err, result){
      if(cb) cb(err,result);
    });
  }

  XPush.prototype.exitChannel = function(chNm, cb){
  	var self = this;
  	self.sEmit('channel-exit', {channel: chNm}, function(err, result){
        if(cb) cb(err,result);
  	});
  };

  XPush.prototype._makeChannel = function(chNm){
    var self = this;
    var ch = new Connection(self,'channel');
    if(chNm) {
      ch.chNm = chNm;
      self._channels[chNm] = ch;
    }
    return ch;
    //if(chNm)
  };

  XPush.prototype.calcChannel = function(ch){
    var self = this;
    if(self._channels.length >= self.maxConnection){
      self._deleteChannel(self._channels[self._channels.length-1]);
    };
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

  XPush.prototype._deleteChannel = function(chO){
    var self = this;
    for(var k in self._channels){
      if(self._channels[k] == chO){
        self._channels[k].disconnect();
        delete self._channels[k];
        break;
      }
    }
  };

  XPush.prototype.isExistChannel = function(chNm){
    var self = this;
  	for(var i = 0 ; i < self.channelNameList.length ; i++){
  		if(self.channelNameList[i] == chNm){
  			return true;
  		}
  	}
  	return false;
  }

  //params.key, value
  XPush.prototype.getUserList = function(params,  cb){
    if(typeof(params) == 'function'){
      cb = params;
      params = {};
    }
    params = params == undefined ? {}: params;
    var self = this;
    console.log("xpush : getUsertList ",params);
    self.sEmit('user-list' ,params,function(err,result){
        if(cb) cb(result);
    });
  };

  XPush.prototype.getUnreadMessage = function(cb){
    var self = this;
    console.log("xpush : getUnreadMessage ");
    self.sEmit('message-unread',function(err, result){
      //app, channel, created 
      console.log("xpush : getUnreadMessage ", result);
      cb(err, result);
    });
  };

  XPush.prototype.getChannelInfo = function(channel, cb){
    var self = this;
    console.log("xpush : getChannelInfo ",channel);
    self.ajax( XPush.Context.NODE+'/'+self.appId+'/'+channel , 'GET', {}, cb);
  };

  XPush.prototype.getGroupUsers = function(groupId,cb){
    var self = this;
	if(typeof(arguments[0]) == 'function') {cb = arguments[0]; groupId = undefined;}
    groupId = groupId ? groupId : self.userId;
    self.sEmit('group-list',{groupId: groupId}, function(err,result){
      cb(err,result);
    });    
  }

  XPush.prototype.addUserToGroup = function(groupId, userIds,cb){
    var self = this;
  	if(typeof(arguments[1]) == 'function') {cb = arguments[1]; userIds = groupId; groupId = undefined;}
    groupId = groupId ? groupId : self.userId;
    userIds = userIds ? userIds : [];
    self.sEmit('group-add',{groupId: groupId, userIds: userIds}, function(err,result){
      //app, channel, created 
      cb(err,result);
    });    
  }

  XPush.prototype.removeUserFromGroup = function(groupId, userId, cb){
    var self = this;
	if(typeof(arguments[1]) == 'function') {cb = arguments[1]; userId = groupId; groupId = undefined;}
    groupId = groupId ? groupId : self.userId;

    self.sEmit('group-remove',{groupId: groupId, userId: userId}, function(err, result){
        cb(err,result);
    });    
  };

  XPush.prototype.getGroups = function(){
    // not defined yet
  }

  XPush.prototype.signout = function(cb){
    //session end 
    var self = this;
    var sendData = { };
    self.ajax( XPush.Context.Signout , 'POST', sendData, cb);
  };

  XPush.prototype.initSessionSocket = function(socket,cb){
    var self = this;
    socket.on('_event',function(data){
      console.log('xpush : session receive ', '_event', data, self.userId);
      // data.event = NOTIFICATION
      // channel,name, timestamp, data= {}
      switch(data.event){
        case 'NOTIFICATION':
          var ch = self.getChannel(data.channel);
          if(!ch){
            ch = self._makeChannel(data.channel);
            self.getChannelInfo(data.channel,function(err,data){
              if(err){
                console.log(" == node channel " ,err);
              }else if ( data.status == 'ok'){
                ch.setServerInfo(data.result);
              }
            });
            self.emit('channel-created', {ch: ch, chNm: data.channel});
            if(!self.isExistChannel(data.channel)) {
              self.emit('newChannel', {chNm : data.channel });
            }
          }
          ch.emit(data.name , data.data);
          self.emit('message', data.channel, data.name, data.data);
        break;

        case 'CONNECT' :
          //app , channel, userId, count
        break;

        case 'DISCONNECT' :

        break;

      }

    }); 
    socket.on('channel',function(data){
      console.log('xpush : session receive ', 'channel', data, self.userId);

      switch(data.event){
        case 'UPDATE':
      // event: update , app,channel,server,count
        break;

        case 'REMOVE' : 
      // event: remove , app,channel
        break;
      };
    }); 
    socket.on('connected',function(){
      console.log('xpush : session receive ', 'channel', arguments, self.userId);
    });

    self.getChannels(function(err,data){
      self.channelNameList = data;
      cb();
    });
  }


  XPush.prototype.ajax = function( context, type, sendData , cb){
    var self = this;
    var sendData = sendData || {};
    console.log("xpush : ajax ", self.hostname+context,type,sendData);
    var ajax = $.ajax({
      url : self.hostname+context,
      type: type,
      data : sendData,
      headers : self.headers
    });

    ajax.done(function(data){
      cb(null,data);
    })
    .fail(function(){
      console.log("xpush : ajax error", self.hostname+context,type,sendData);
      cb(new Error(),{});
    });
    return ajax;
  }

  XPush.prototype.sEmit = function(key, params, cb){
    var self = this;

    var returnFunction = function(result){
      if(result.status == 'ok'){
        cb(null, result.result);
      }else{
        console.error("xpush : emit error ", key,result.message);
        cb(result.message);
      }
    }

    if( typeof(arguments[1]) == 'function' ){
      cb = params;
      self._sessionConnection._socket.emit(key, returnFunction);
    }else{
      self._sessionConnection._socket.emit(key, params, returnFunction);
    }
    return;
  };

  XPush.prototype.on = function(event, fct){
    var self = this;
    self._events = self._events || {};
    self._events[event] = self._events[event] || [];
    self._events[event].push(fct);

    if(event == RMKEY ){
      self.getUnreadMessage(function(err, data){
        if(data && data.length > 0 ) 
        for(var i = data.length ; i > 0; i--){
          data[i].message.data = JSON.parse(data[i].message.data);
          receiveMessageStack.shift([RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data]);
          //self.emit(RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data);
        }
        self.isExistUnread = false;
        for(var i = 0 ; i < self.receiveMessageStack.length;i++){
          self.emit.apply(self, self.receiveMessageStack[i]);  
        }
      });
    };        
    /*
    if(event == RMKEY ){
      self.getUnreadMessage(function(err, data){
        console.log("================================= " ,data);
        self._events = self._events || {};
        self._events[event] = self._events[event] || [];
        self._events[event].push(fct);

        if(data && data.length > 0 ) 
        for(var i = data.length ; i > 0; i--){
          data[i].message.data = JSON.parse(data[i].message.data);
          receiveMessageStack.shift([RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data]);
          //self.emit(RMKEY,  data[i].message.data.channel, data[i].name,  data[i].message.data);
        }

        self.isExistUnread = false;
      });
    }else{
      self._events = self._events || {};
      self._events[event] = self._events[event] || [];
      self._events[event].push(fct);
    }
    */
  };

  XPush.prototype.off = function(event, fct){
  	var self = this;
    self._events = self._events || {};
    if( event in self._events === false  )  return;
    self._events[event].splice(self._events[event].indexOf(fct), 1);
  };
  XPush.prototype.emit = function(event){
    var self = this;

    if(self.isExistUnread) {
      receiveMessageStack.push(arguments);  
    }else{
      self._events = self._events || {};
      if( event in self._events === false  )  return;
      for(var i = 0; i < self._events[event].length; i++){
        self._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
      };      
    }
  };

  var Connection = function(xpush , type, server){
    var self = this;
    this._xpush = xpush;
    this._server = server;
    this._type = type;
    this._socketStatus; // disconnected, connected
    this._socket;
    this.checkTimer;
  	this.info;
    this.messageStack = [];


    //self.on('received', function(data){
      //self._xpush.calcChannel(self);
    //});
  };

  Connection.timeout = 30000;

  Connection.prototype.checkConnectionTimeout = function(b){
    var self = this;
    if(self.checkTimer) clearTimeout(self.checkTimer);
  
    if(b){
      self.checkTimer = setTimeout(function(){
        self._socket.disconnect();
      },timeout);
    }    
  }

  Connection.prototype.setServerInfo = function(info){
    console.log("xpush : setServerInfo ", info);
    var self = this;
  	self.info = info;
  	self._server = {serverUrl : info.server.url};
  	self.chNm = info.channel;
  	self.connect(function(){
    console.log("xpush : setServerInfo end ", arguments,self._xpush.userId, self.chNm);
      self.connectionCallback();      
  	});
  };

  Connection.prototype.connect = function(cbConnect){
    var self = this;
      var query =
        'app='+self._xpush.appId+'&'+
        //'channel='+CONF._channel+'&'+
        //'server='+data.result.server.name+'&'+
        'userId='+self._xpush.userId+'&'+
        'deviceId=WEB'+'&'+
        'token='+self._server.token;
        //'mode=CHANNEL_ONLY';

    if(self._type == 'channel'){
      query = 
        'app='+self._xpush.appId+'&'+
        'channel='+self.chNm+'&'+
        'userId='+self._xpush.userId+'&'+
        'deviceId=WEB'+'&'+
        'server='+self.info.server.name;
    }

    this._socket = io.connect(self._server.serverUrl+'/'+self._type+'?'+query, socketOptions);

    console.log( 'xpush : socketconnect', self._server.serverUrl+'/'+self._type+'?'+query);
    this._socket.on('connect', function(){
      self.connectionCallback();
      cbConnect(); 
    });

  };

  Connection.prototype.connectionCallback = function(){
    var self = this;
    while(self.messageStack.length > 0 ){
      var t = self.messageStack.splice(0,1)[0];
      self.send(t.name, t.data);
    };

  	self._socket.on('message',function(data){
  		console.log("xpush : channel receive ", self.chNm, data, self._xpush.userId);
  		self._xpush.emit(RMKEY, self.chNm, RMKEY , data);
  	});
  };

  Connection.prototype.disconnect = function(){
    this._socket.disconnect();
    //delete this._socket;
  };

  Connection.prototype.send = function(name, data,cb){
  	var self = this;
    if(self._socket.connected){
      self._socket.emit('send', {name: name , data: data});
    }else{
      self.messageStack.push({name: name, data: data});
    }  	
  }

  Connection.prototype.on = function(event, fct){
   var self = this;
    self._events = self._events || {};
    self._events[event] = self._events[event] || [];
    self._events[event].push(fct);
  };
  Connection.prototype.off = function(event, fct){
    var self = this;
    self._events = self._events || {};
    if( event in self._events === false  )  return;
    self._events[event].splice(self._events[event].indexOf(fct), 1);
  };
  Connection.prototype.emit = function(event /* , args... */){
    var self = this;
    self._events = self._events || {};
    if( event in self._events === false  )  return;
    for(var i = 0; i < self._events[event].length; i++){
      self._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    };
  };

  //window.XPush = new XPush();
  window.XPush = XPush;
/*
  G( SessionSocket );

  G.init( applicationKey );

 - Application의 모든 사용자 
  G.getUserList();

 - 내가 채널 정보 생성 
  var CH01 = G.createChannel('channel01', [userId, userId2, userId3]);
  and 
  var CH01 = G.getChannel('channel01');

 - 채널에서 나가기 
  CH01.leaved();
 
 - 채널의 사용자 리스트 
  var memberIds = CH01.getUserList();

 - 채널에서 보내는 메시지 받기
  CH01.onMsg('key01',function(data){
    // data
  });

 - 채널에서 보내는 모든 메시지 받기 
  CH01.onMsg(function(data){
    // 모든 key 들을 전부 받는 이벤트  
  });

 - 채널에서 사용자가 탈퇴했음
  CH01.onMemberLeaved(function(userIds){

  });

 - 채널에 사용자를 추가했음
  CH01.onMemberJoined(function(userIds){

  });

 - 채널이 사라졌음
  CH01.onDestoryed(function(userIds){

  });

 - 채널에 메시지 전송하기 
  CH01.send('key09',{ key1: 'value01', key2: 'value02'});

 - 채널이 생성되면서 내가 들어왔음 
  G.on('channelCreated',function(chObj, data){
    // data {chName: 'string', chMember : [] } 
    chObj.onMsg('...' , function(data){...}); 
    or  
    var CH02 = G.getChannel(data.chName);
  });

  1. SessionSocket 은 싱글 인스턴스
  2. Channel 은 create 를 하든 get 을 하든 Channel 명당 하나의 객체만을 생성한다.
  3. Message 는 SessionSocket에서 받든 channelSocket 에서 받든 상관없이 channel 객체에 이벤트가 발생한다.
  4. send 는 channel 정보의 서버로 rest 로 던진다. socket이 연결되어 있으면 socket 으로 전송 ( send 함수 )
  5. listen 하기 위한 Message Socket 은 최근 5초간(설정) 연속적인 메시지가 가장 많은 곳으로 다시 연결한다??
*/
})();

