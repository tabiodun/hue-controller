Overview
===
Adds a wrapper around the hue API to give you better flexibility than you get with the apps without having to manually write the API calls.

Unlike the app, you have more granular access to the exposed functionality, such as queuing by date rather than just time. In addition to helpers like "Queue this 5 times every 5 seconds start on 2012-10-10 at 5 PM"

Running
-
You will need ruby installed (this is all tested against ruby-1.9.3-p327, but any ruby-1.9.3 should work.

Run `bundle install` in the directory to install the necessary gems, and then just `thin -R config.ru -p 9200 start` and that's it. You can then navigate to localhost:9200 and play with this.