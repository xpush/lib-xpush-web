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
		QUnit.asyncTest("login xpush3",function(assert){

	    	expect(10);
			for(var i = 1 ; i <= 100; i++){
				xpush1.signup('notdol'+(100+i),'win1234',function(){
					assert.equal(true, true, "login failed!");
				});
			}
			QUnit.start();
			cb();
		});
    }
]);