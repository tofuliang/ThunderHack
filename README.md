#Thunder Hack

http://syslab.ddns.us/thunder_hack

#Description

Thunder Hack is a web app where you can directly get the download link of a specified file stored on Xunlei Lixian servers without having a Xunlei VIP account. Thanks to the optimal routes to the nearest Lixian servers with wide bandwidth, everyone can enjoy high speed downloading for free as the VIP users do. The main idea is to share the app provider's VIP account by submitting original download links to the provider's Lixian space and crawling the Lixian urls. The project consists of web services and Chrome extension.

#Deployment - development mode

* Create file ```web/login_info.json``` and save the login info of your Xunlei VIP account. The content of the json file may look like this:  

```
{
	"email":"YOUR_EMAIL_ADDRESS@EMAIL_PROVIDER.com", 
	"password":"YOUR_PASSWORD"
}
```

* Run the crypto server by :

```
$ node crypto_server.js
```

* Run the web server to generate cookie.txt : 

```
$ sudo python runweb.py
```

* Re-run the web server by using the command above.

#Usage:

The recommanded way to use this app is simply installing the Chrome extension by dragging the ```chrome-ext.crx``` to your Chrome extension management page. Before downloading files on Lixian servers, remember to click the activate button in the popup panel of the extension, or the Lixian servers are likely to reject the download request with 400 responses.

#TODO:

* JS scripts to automatically generate Aria2 download commands.

* API documentation.

* Deployment in production mode.
