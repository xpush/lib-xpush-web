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
  
  xpush.message('msg', function (data){
    console.log('message from someone : '+data.message);
  });
  
  xpush.send('msg', {name:'John', message:'Hi Me?'}); 
  
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
