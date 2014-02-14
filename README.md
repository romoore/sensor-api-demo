# Transmitter RSSI Demo #

Author: Robert S. Moore 

## Configure/Build ##
* First, edit web.xml in src/main/webapp/WEB-INF/web.xml and change the
	context-param 'agg.host' value from 'localhost' to where your aggregator is
	running.
* Next, compile and build with Maven like this:
    mvn clean package war:war
* Now the war is built in target/sensor-api-demo.war
* In www/js/visualize.js, change the variable 'baseURL' to be wherever your
	tomcat will host the service. I ran my locally over an HTTPS connection on
	an alternative port. Yours might be 'http://www.awesome.com/rssi/p/rssi/'.

## Install ##
* To install the service/WAR file, copy it into Tomcat's webapps directory. In
	my installation, it's /var/lib/tomcat7/webapps/.  It might be different for
	you.  Once Tomcat's cool with that (tail the catalina.out log), you can now
	put the web content somewhere.
* Copy all the stuff in the 'www' folder into some folder on a web server. I
	run Apache, so mine went in /var/www/sensor-vis. Then I could view it in my
	browser at http://localhost/sensor-vis.  Your mileage may vary!

## Questions ##
* If you have any questions, it's probably because this is a demo and doesn't
	work well.  I wrote it on Feb 13, 2014 because of the snow.  Maybe I will
	make it better later.
