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
		QUnit.asyncTest("login xpush1",function(assert){
			expect(1);
			window.xpush.login(USERS[0],PASS[0],function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();
			});
	        cb(null);
		});
}]);