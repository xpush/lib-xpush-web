var HOST = "http://demo.stalk.io:8000";
var APPID = 'demo';

var xpush = new XPush(HOST,APPID);

var USERS = ['notdol110','notdol111','notdol112','notdol113'];
var PASS = ['win1234','win1234','win1234','win1234'];
var DEVICEID = 'testunit';
var CHANNEL = [];

QUnit.module("init",{
	setup : function(assert){
	}
})

async.series([
  function(cb){
		QUnit.asyncTest("signup 1",function(assert){

	    expect(100);
			for(var i = 1 ; i <= 100; i++){
				xpush.signup('notdol'+(100+i),'win1234', function(){
					assert.equal(true, true, "signup failed!");
				});
			}
			QUnit.start();
			cb();
		});
  },
  function(cb){
		QUnit.asyncTest("signup 2",function(assert){

	    expect(100);
			for(var i = 101 ; i <= 200; i++){
				xpush.signup('notdol'+(200+i),'win1234',DEVICEID, function(){
					assert.equal(true, true, "signup failed!");
				});
			}
			QUnit.start();
			cb();
		});
	}
]);