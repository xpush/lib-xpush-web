# xpush javascript library

The simplest way to develop real-time web communication on web browsers.

- **The project is currently under development. Not yet available.**

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

## Getting Started
Download the [production version][min].

[min]: https://raw.github.com/xpush/lib-xpush-javascript/master/dist/xpush.min.js

In your web page:

```html
<script src="dist/xpush.min.js"></script>
<script>
  var xpush = new XPush('http://local.host:8000', 'APP_ID');
  
  var channel = xpuh.createChannel(['userId'], /* channelName(option)*/);
  channel.send('key',{value1: 'value1', value2: 'value2'});

  // =================== message receive 1 
  xpush.message('message', function (data){
    // channel is data.channel
    // name is data.name
    // data is data.data
    console.log('message from someone : '+ data.data);
  });

  // =================== message receive 1 
    xpush.on('channel-created', function(data){
        // data.chNm, data.ch
        var channel2 = data.ch;
        channel2.on('name',function(data){
            channel2.send('name','this is return value');
        })
    });
</script>
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_


## License
xpush libraries may be freely distributed under the MIT license.
