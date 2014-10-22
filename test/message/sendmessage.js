//  test : XPush.send(channel.chNm, sendName, sendData);
// session receive & channel receive
var xpush = new XPush(HOST,APPID);
var xpush1 = new XPush(HOST,APPID);
var xpush2 = new XPush(HOST,APPID);
var xpush3 = new XPush(HOST,APPID);

var USERS = ['notdol110','notdol111','notdol112','notdol113'];
var PASS = ['win1234','win1234','win1234','win1234'];
var DEVICEID = 'testunit';
var CHANNEL = [];
var MESSAGES = [];
var MSG_CNT = 10;
var SENDNAME = 'message';

QUnit.module("init",{
  setup : function(assert){
  }
})
async.series([
  function(cb){
    QUnit.test("init xpush",function(assert){
      assert.ok(xpush, " XPush created...");
    });
    cb();
  },
  function(cb){
    QUnit.asyncTest("login xpush1",function(assert){
      expect(1);
      xpush.login(USERS[0],PASS[0],function(err){
        assert.equal(err, undefined, "login success!");
        QUnit.start();
      });
      cb(null);
    });
  },
  function(cb){
    QUnit.asyncTest("login xpush2",function(assert){
      expect(1);
      xpush1.login(USERS[1],PASS[1],function(err){
        assert.equal(err, undefined, "login success!");
        QUnit.start();
      });
      cb(null);
    });
  },
  function(cb){
    QUnit.asyncTest("login xpush3", function(assert){
      expect(1);
      xpush2.login(USERS[2],PASS[2], function(err){
        assert.equal(err, undefined, "login success!");
        QUnit.start();
      });
      cb(null);
    });
  },
  function(cb){
    QUnit.asyncTest("login xpush4", function(assert){
      expect(1);
      xpush3.login(USERS[3],PASS[3], function(err){
        assert.equal(err, undefined, "login success!");
        QUnit.start();
      });
      cb(null);
    });
  },
  function(cb){
    QUnit.asyncTest("send Message & receive Message 2 ",function(assert){
      expect(6);
      var channelName = 'TEST_CH01';
      var sendName = 'message';

      xpush2.on('message',function(ch,name,data){
        assert.equal(ch, channelName, "channel name is " + ch );
        assert.equal(name, sendName, "send name is " + name );
        assert.ok( true, JSON.stringify( data ) );
        checkComplete();
      });

      xpush3.on('message',function(ch,name,data){
        assert.equal(ch, channelName, "channel name is " + ch );
        assert.equal(name, sendName, "send name is " + name );
        assert.ok( true, JSON.stringify( data ) );
        checkComplete();
      });

      xpush.createChannel(['notdol112', 'notdol113'], channelName, function(err, name){
        xpush.send( channelName, sendName,{data:'asdf'});
      });

      var count = 2;
      var checkComplete = function(){       
        --count; 
        if( !count) {
          QUnit.start(); cb(null);
        }
      }
    });
  }
]);
