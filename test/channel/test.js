var HOST = "http://www.notdol.com:8000";
var APPID = 'stalk-io';

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
		QUnit.asyncTest("login xpush1",function(assert){
			expect(1);
			window.xpush.login(USERS[0],PASS[0],function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();
			});
	        cb(null);
		});
    },
    function(cb){
		QUnit.asyncTest("login xpush2",function(assert){
			expect(1);
			window.xpush1.login(USERS[1],PASS[1],function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();
			});
	        cb(null);
		});
    },
    function(cb){
		QUnit.asyncTest("login xpush3",function(assert){
			expect(1);
			window.xpush2.login(USERS[2],PASS[2],function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();
			});
	        cb(null);
		});
    },
    function(cb){
		QUnit.asyncTest("login xpush4",function(assert){
			expect(1);
			window.xpush3.login(USERS[3],PASS[3],function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();
			});
	        cb(null);
		});
    },
    function(cb){
		QUnit.asyncTest("create channel",function(assert){
			expect(6);
			var channel = window.xpush.createChannel([USERS[1],USERS[2]],undefined, function(err){
				assert.equal(err, null, "channel connect complete!");
				xpush.getChannels(function(err,result){
					assert.equal(err, null, "channel connect complete!");
					assert.ok(result, "retrieve channel complete!");
					assert.equal(result.length , 1 , 'channel create one!');
					assert.equal(result[0].channel , channel.chNm , 'channel name is right!');
					console.log("========= notdol");
					console.log(result[0]);
					CHANNEL.push(channel.chNm);
					QUnit.start(); cb(null);
				});
			});
			assert.ok(channel,' channel object is created!');
		});
    },
    function(cb){
		QUnit.asyncTest("retrieve channel1",function(assert){
			expect(4);
			xpush1.getChannels(function(err,result){
				var channelName = CHANNEL[0];
				assert.equal(err, null, "channel connect complete!");
				assert.ok(result, "retrieve channel complete!");
				assert.equal(result.length , 1 , 'channel create one!');
				assert.equal(result[0].channel , channelName , 'channel name is right!');
				QUnit.start(); cb(null);
			});
		});
    },
    function(cb){
		QUnit.asyncTest("retrieve channel2",function(assert){
			expect(4);
			xpush2.getChannels(function(err,result){
				var channelName = CHANNEL[0];
				assert.equal(err, null, "channel connect complete!");
				assert.ok(result, "retrieve channel complete!");
				assert.equal(result.length , 1 , 'channel create one!');
				assert.equal(result[0].channel , channelName , 'channel name is right!');
				QUnit.start(); cb(null);
			});
		});
    },
    function(cb){
		QUnit.asyncTest("exit channel1",function(assert){
			expect(3);
			var channelName = CHANNEL[0];
			xpush.exitChannel(channelName, function(err,result){
				assert.equal(err, null, "channel connect complete!");
				xpush1.exitChannel(channelName, function(err,result){
					assert.equal(err, null, "channel connect complete!");
					xpush2.exitChannel(channelName, function(err,result){
						assert.equal(err, null, "channel connect complete!");
						QUnit.start(); cb(null);
					});
				});
			});
		});
		// todo 채널에서 모든 사용자가 나갔지만 채널 정보는 없어지지 않았습니다. 
    },


]);