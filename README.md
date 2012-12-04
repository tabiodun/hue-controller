Overview
===
Adds a wrapper around the hue API to give you better flexibility than you get with the apps without having to manually write the API calls.

Unlike the app, you have more granular access to the exposed functionality, such as queuing by date rather than just time. In addition to helpers like "Queue this 5 times every 5 seconds start on 2012-10-10 at 5 PM"

Browser requirements
-
The general web app will work under most modern browser browsers. IE8 and below are not supported, but some areas might work. Color pickers requires that your browser support it, which currently means only Chrome.

Examples
-

Light Status: [click here](https://github.com/zanker/hue-controller/blob/master/examples/index.png?raw=true)

Light Control: [click here](https://github.com/zanker/hue-controller/blob/master/examples/control.png?raw=true)

Schedule: [click here](https://github.com/zanker/hue-controller/blob/master/examples/schedules.png?raw=true)

Running
-
You will need ruby installed (this is all tested against ruby-1.9.3-p327, but any ruby-1.9.3 should work.

If you don't have bundler installed yet, you will need to do `gem install bundler` before running `bundle install`.

Run `bundle install` in the directory to install the necessary gems, and then just `thin -R config.ru -p 9200 start` and that's it. You can then navigate to localhost:9200 and play with this.

Contributing
-
Pull requests are more than welcome if you want to add new functionality or ways of extending the Hue lightbulbs.

You can find documentation on the API at: http://blog.ef.net/2012/11/02/philips-hue-api.html
