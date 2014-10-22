# xpush javascript library

The simplest way to develop real-time web communication on web browsers.

- **The project is currently under development. Not yet available.**

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

## Install 
Just add script in your web page : 
Download the [production version][min].

[min]: https://raw.githubusercontent.com/xpush/lib-xpush-web/master/src/xpush.js

```html
<script src="xpush.min.js"></script>
```

## Getting Started

In your web page:

Data send
```html
<script>
  var xpush1 = new XPush('http://demo.stalk.io:8000', 'APP_ID');
  xpush1.login('userid1','password',function(){ 
      xpush1.send('channelname','message',data); 
  }); 
</script>
```

Other user receive data
```html
<script>
  var xpush2 = new XPush('http://demo.stalk.io:8000', 'APP_ID');
  xpush2.login('userid2','password',function(){
    xpush2.on('message',function(channel, name, data){
      // channel is channelname, name is key, data is data!
    });
  });
</script>
```

## Documentation

http://xpush.github.io/doc/library/javascript/

## Examples
#### message send

Use XPush Object! But you must know your target channel name;
```html
<script>
  var xpush1 = new XPush('http://demo.stalk.io:8000', 'APP_ID');
  xpush1.login('userid1','password',function(){
      xpush1.send('channelname','message',data);
  });
</script>
```

Channel Create & Use Channel Object
```html
<script>
  var xpush2 = new XPush('http://demo.stalk.io:8000', 'APP_ID');
  
  xpush2.login('userid2','password',function(){
    var channel = xpush2.createChannel([userid1, userid2 ...], /*channelName(option),*/ function(err, channelName){

      });
    channel.send('message',data);
  });
</script>
```

#### receive message
```html
<script>
  var xpush3 = new XPush('http://demo.stalk.io:8000', 'APP_ID');
  
  xpush3.login('userid3','password',function(){
    xpush3.on('message',function(channelname, name, data){
      // read unreadmessages & ready to receive messages
    });
  });
</script>
```

#### create channel
```html
<script>
  var xpush4 = new XPush('http://demo.stalk.io:8000', 'APP_ID');
  
  xpush4.login('userid4','password',function(){
    var channel = xpush4.createChannel([userid1, userid2 ...], /*channelName(option),*/ function(err, channelName){

      });
  });
</script>
```
#### create channel event

```html
<script>
  var xpush = new XPush('http://demo.stalk.io:8000', 'APP_ID');
  
  xpush.login('userid','password',function(){
    xpush.on('newchannel',function(chnnelObject){
      // channelname is : channelObject.chNm
    });
  });
</script>
```

## License
xpush libraries may be freely distributed under the MIT license.
