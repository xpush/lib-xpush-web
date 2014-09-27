//	test : XPush.send(channel.chNm, sendName, sendData);
// session receive & channel receive

var HOST = "http://demo.stalk.io:8000";
var APPID = 'demo';

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
		QUnit.asyncTest("login xpush3", function(assert){
			expect(1);
			window.xpush2.login(USERS[2],PASS[2], function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();
			});
	        cb(null);
		});
    },
    function(cb){
		QUnit.asyncTest("login xpush4", function(assert){
			expect(1);
			window.xpush3.login(USERS[3],PASS[3], function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();
			});
	        cb(null);
		});
    },
/*

    function(cb){
		QUnit.asyncTest("create channel",function(assert){
			expect(6);
			var channel = window.xpush.createChannel([USERS[1],USERS[2]],undefined, function(err){
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
			var MAX = ( (MSG_CNT) * 2 * 3 ) * 2;
			expect(MAX);

			var channel = CHANNEL[0];
			var channelName = channel.chNm;

			var sendData = {"a":"a"};
			var sendName = 'message';
			xpush.on('message',function(ch,name,data){
				assert.equal(ch, channelName, "channel name is right1!");
				assert.equal(name, sendName, "send name is right1!");
				//assert.equal(sendData, data, "send data is right1!");
				cnt++; checkComplete();
			});

			xpush1.on('message',function(ch,name,data){
				assert.equal(ch, channelName, "channel name is right1!");
				assert.equal(name, sendName, "send name is right1!");
				//assert.equal(sendData, data, "send data is right1!");	
				cnt++; checkComplete();
			});

			xpush2.on('message',function(ch,name,data){
				assert.equal(ch, channelName, "channel name is right2!");
				assert.equal(name, sendName, "send name is right2!");
				//assert.equal(sendData, data, "send data is right2!");	
				cnt++; checkComplete();
			});

			//channel.send(sendName,sendData);

			for(var i = 0 ; i < MSG_CNT ; i++){
				var sendData = {"a":"a", cnt: i};
				xpush.send(channel.chNm, sendName, sendData);
				sendData.channel = channelName;
				MESSAGES.push(sendData);
				console.log("test : "+ i);
			};

			setTimeout(function(){
				for(var i = 0 ; i < MSG_CNT ; i++){
					var sendData = {"a":"a", cnt: i};
					xpush.send(channel.chNm, sendName, sendData);
					sendData.channel = channelName;
					MESSAGES.push(sendData);
					console.log("test : "+ i);
				};

			},3000);			

			var cnt = 0 ;
			var checkComplete = function(){
				if(MAX / 2 <= cnt) {
					QUnit.start(); cb(null);
				}
			}
		});
    },
    */
    function(cb){
		QUnit.asyncTest("send Message & receive Message 2 ",function(assert){
			//var MAX = ( (MSG_CNT) * 2 * 3 ) * 2;
			expect(4);
			var channelName = 'TEST_CH01';
			xpush2.on('message',function(ch,name,data){
				assert.equal(ch, channelName, "channel name is right1!");
				assert.equal(name, SENDNAME , "send name is right1!");
				cnt++; checkComplete();
			});

			xpush3.on('message',function(ch,name,data){
				assert.equal(ch, channelName, "channel name is right2!");
				assert.equal(name, SENDNAME, "send name is right2!");
				cnt++; checkComplete();
			});
			xpush.createChannel(['notdol112', 'notdol113'], channelName, function(err, name){
				xpush.send( channelName, 'message',{data:'asdf'});
			});


			var cnt = 0 ;
			var checkComplete = function(){
				console.log(cnt);
				if(2 <= cnt) {
					QUnit.start(); cb(null);
				}
			}


		});

	}
]);
