var xpush = new XPush(HOST,APPID);
var xpush1 = new XPush(HOST,APPID);
var xpush2 = new XPush(HOST,APPID);

var USERS = ['notdol110','notdol111','notdol112','notdol113'];
var PASS = ['win1234','win1234','win1234','win1234'];
var CHANNEL = [];

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
		QUnit.asyncTest("login xpush3",function(assert){
			expect(1);
			xpush2.login(USERS[2],PASS[2],function(err){
				assert.equal(err, undefined, "login success!");
				QUnit.start();
			});
	    cb(null);
		});
  },
  function(cb){
		QUnit.asyncTest("create random channel without data",function(assert){
			expect(5);
			var channel = xpush.createChannel([USERS[1],USERS[2]], function(err, channelName){
				assert.equal(err, null, "channel connect complete : " + channelName );
				xpush.getChannelData(channelName, function(err,result){
					assert.ok(result, "retrieve channel complete!");
					assert.equal(result.US.length , 3 , 'channel has 3 users' );
					assert.equal(result.C , channel.chNm , 'channel name is right!');
					CHANNEL.push(channel.chNm);
					checkComplete();
				});
			});
			assert.ok(channel,' channel object is created!');

	    var count = 1;
      var checkComplete = function(){       
        --count; 
        if( !count) {
          QUnit.start(); cb(null);
        }
      }		
		});
  },
  function(cb){
		QUnit.asyncTest("retrieve channel1",function(assert){
			expect(1);
			xpush1.getChannels(function(err,result){
				assert.ok(result, "retrieve channel complete! : " + result.length);
				QUnit.start(); cb(null);
			});
		});
  },
  function(cb){
		QUnit.asyncTest("retrieve channel2",function(assert){
			expect(1);
			xpush2.getChannels(function(err,result){
				assert.ok(result, "retrieve channel complete! : " + result.length);
				QUnit.start(); cb(null);
			});
		});
  },
  function(cb){
		QUnit.asyncTest("Exit channel",function(assert){
			expect(3);
			var channelName = CHANNEL[0];
			xpush.exitChannel(channelName, function(err,result){
				assert.equal(err, null, "notdol110 exit channel complete!");
				xpush1.exitChannel(channelName, function(err,result){
					assert.equal(err, null, "notdol111 exit channel complete!");
					xpush2.exitChannel(channelName, function(err,result){
						assert.equal(err, null, "notdol112 exit channel complete!");
						QUnit.start(); cb(null);
					});
				});
			});
		});		
  },
  function(cb){
  	// todo 채널에서 모든 사용자가 나가면 channel 정보는 사라진다.
		QUnit.asyncTest("channel check1",function(assert){
			expect(1);
			var channelName = CHANNEL[0];
			xpush.getChannelData(channelName, function(err,result){
			  assert.equal(err, 'ERR-NOTEXIST', "Channel is removed");
			  QUnit.start(); cb(null);
			});
		});
  }
]);