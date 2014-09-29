var HOST = "http://demo.stalk.io:8000";
var APPID = 'demo';

var xpush = new XPush(HOST,APPID);
var xpush1 = new XPush(HOST,APPID);
var xpush2 = new XPush(HOST,APPID);
var xpush3 = new XPush(HOST,APPID);

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
		QUnit.asyncTest("login xpush",function(assert){
			expect(1);
			xpush.login(USERS[0],PASS[0],function(err){
				assert.equal(err, undefined, "login success!");
				QUnit.start();
			});
	    cb(null);
		});
  },
  function(cb){
		QUnit.asyncTest("login xpush1",function(assert){
			expect(1);
			xpush1.login(USERS[1],PASS[1],function(err){
				assert.equal(err, undefined, "login success!");
				QUnit.start();
			});
	    cb(null);
		});
  },
  function(cb){
		QUnit.asyncTest("login xpush2",function(assert){
			expect(1);
			xpush2.login(USERS[2],PASS[2],function(err){
				assert.equal(err, undefined, "login success!");
				QUnit.start();
			});
	    cb(null);
		});
  },
  function(cb){
		QUnit.asyncTest("create channel",function(assert){
			expect(6);
			var channel = xpush.createChannel([USERS[1],USERS[2]], function(err){
				assert.equal(err, null, "channel connect complete!");
				xpush.getChannels(function(err,result){
					assert.equal(err, null, "channel connect complete!");
					assert.ok(result, "retrieve channel complete!");
					assert.ok(result.length > 0 , 'channel create one!');
					assert.equal(result[result.length-1].channel , channel.chNm , 'channel name is right!');
					CHANNEL.push(channel);
					QUnit.start(); cb(null);
				});
			});
			assert.ok(channel,' channel object is created!');
		});
  },
  function(cb){
		QUnit.asyncTest("send Message & receive Message 1 ",function(assert){
			expect(6);

			var channel = CHANNEL[0];
			var channelName = channel.chNm;

			var sendData = {"a":"a"};
			var sendName = 'message';
			xpush1.on('message',function(ch,name,data){
				assert.equal(ch, channelName, "channel name is " + ch );
				assert.equal(name, sendName, "send name is " + name );
				assert.ok( true, JSON.stringify( data ) );
				checkComplete();
			});

			xpush2.on('message',function(ch,name,data){
				assert.equal(ch, channelName, "channel name is " + ch );
				assert.equal(name, sendName, "send name is " + name );
				assert.ok( true, JSON.stringify( data ) );
				checkComplete();
			});

			channel.send(sendName,sendData);
			sendData.channel = channelName;

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