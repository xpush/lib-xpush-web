var HOST = "http://www.notdol.com:8000";
var APPID = 'stalk-io';

var xpush = new XPush(HOST,APPID);
var xpush1 = new XPush(HOST,APPID);
var xpush2 = new XPush(HOST,APPID);
var xpush3 = new XPush(HOST,APPID);

var USERS = ['notdol110','notdol111','notdol112','notdol113'];
var PASS = ['win1234','win1234','win1234','win1234'];

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
			window.xpush.login(USERS[0],PASS[0],function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();
			});
	        cb(null);
		});
    },
    function(cb){
		QUnit.asyncTest("login xpush",function(assert){
			expect(1);
			window.xpush.login('notdol101','win1234',function(err){
				assert.equal(err, undefined, "login failed!");
				QUnit.start();

			});
	        cb(null);
		});
    },
    function(cb){
		QUnit.module("xpush group");

			async.series([
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(3);
						xpush.getGroupUsers(function(err, data){
							assert.equal(err, undefined, 'getGroupUsers function is ok');
							assert.ok(data, 'Group data is OK');
							assert.equal(data.length , 0 , ' Group data size is 0 ');
							QUnit.start(); cb2();
						});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(1);
						xpush.addUserToGroup([USERS[1]], function(err,data){
							assert.equal(err, null, 'addUserToGroup function is ok');				
							QUnit.start(); cb2();
						});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(1);			    	
					xpush.addUserToGroup([USERS[2],USERS[3]], function(err,data){
						assert.equal(err, undefined, 'addUserToGroup function is ok');				
						QUnit.start(); cb2();
					});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(1);			    				    	
					xpush.addUserToGroup([USERS[2]], function(err,data){
						assert.equal(err, undefined, 'addUserToGroup function is ok');				
						QUnit.start(); cb2();
					});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(3);			    				    	
					xpush.getGroupUsers(function(err, data){
						assert.equal(err, undefined, 'getGroupUsers function is ok');	
						assert.ok(data, 'Group data is OK');
						assert.equal(data.length , 3 , ' Group data size is 3 ');
						QUnit.start(); cb2();
					});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(1);			    				    	
					xpush.removeUserFromGroup(USERS[1], function(err, data){
						assert.equal(err, undefined, 'getGroupUsers function is ok');	
						QUnit.start(); cb2();
					});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(1);			    				    				    	
					xpush.removeUserFromGroup(USERS[2], function(err, data){
						assert.equal(err, undefined, 'getGroupUsers function is ok');	
						QUnit.start(); cb2();
					});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(3);			    				    				    	
					xpush.getGroupUsers(function(err, data){
						assert.equal(err, undefined, 'getGroupUsers function is ok');	
						assert.ok(data, 'Group data is OK');
						assert.equal(data.length , 1 , ' Group data size is 1 ');
						QUnit.start(); cb2();
					});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(1);			    				    				    	
					xpush.removeUserFromGroup(USERS[3], function(err, data){
						assert.equal(err, undefined, 'getGroupUsers function is ok');	
						QUnit.start(); cb2();
					});
					});
			    },
			    function(cb2){
					QUnit.asyncTest("xpush group",function(assert){
						expect(3);			    				    				    	
					xpush.getGroupUsers(function(err, data){
						assert.equal(err, undefined, 'getGroupUsers function is ok');	
						assert.ok(data, 'Group data is OK');
						assert.equal(data.length , 0 , ' Group data size is 0 ');
						QUnit.start(); cb2();
					});
					});
			    }
			]);
    }    
]);

