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
		QUnit.asyncTest("signup 1", function(assert){
			xpush.signup(USERS[0],PASS[0], function(err, data){
				if( typeof data == 'object'&& data.status ){
					assert.equal(data.status, "ok", "User register success");
				} else {
					assert.equal(data, "ERR-USER_EXIST", "User already exist");	
				}
				QUnit.start();
			});
			cb();
		});
  },
  function(cb){
		QUnit.asyncTest("signup 2", function(assert){			
			xpush.signup(USERS[1],PASS[1], function(err, data){
				if( typeof data == 'object' && data.status ){
					assert.equal(data.status, "ok", "User register success");
				} else {
					assert.equal(data, "ERR-USER_EXIST", "User already exist");	
				}
				QUnit.start();
			});
			cb();
		});
  },
  function(cb){
		QUnit.asyncTest("signup 3", function(assert){			
			xpush.signup(USERS[2],PASS[2], function(err, data){
				if( typeof data == 'object' && data.status ){
					assert.equal(data.status, "ok", "User register success");
				} else {
					assert.equal(data, "ERR-USER_EXIST", "User already exist");	
				}
				QUnit.start();
			});
			cb();
		});
  },
  function(cb){
		QUnit.asyncTest("signup 4", function(assert){			
			xpush.signup(USERS[3],PASS[3], function(err, data){
				if( typeof data == 'object' && data.status ){
					assert.equal(data.status, "ok", "User register success");
				} else {
					assert.equal(data, "ERR-USER_EXIST", "User already exist");	
				}
				QUnit.start();
			});
			cb();
		});
  }  
]);