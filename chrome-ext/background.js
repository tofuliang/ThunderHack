var enabled = false;

var host = '';
var gdriveid = '';
var host_addr = 'https://raw.githubusercontent.com/Chion82/Chion82.github.io/master/server_host';

function set_cookie() {
  chrome.cookies.set({
    url : 'http://vip.xunlei.com',
    domain : 'vip.xunlei.com',
    name : 'gdriveid',
    value : gdriveid
  }, function(cookie){
     console.log(JSON.stringify(cookie));
     console.log(chrome.extension.lastError);
     console.log(chrome.runtime.lastError);
  });
}

function remove_cookie() {
  chrome.cookies.remove({
    url : 'http://vip.xunlei.com',
    name : 'gdriveid'
  }, function(details){

  });
}

function ajax_get(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
       callback(xhr.responseText);
    }
  }
  xhr.send();
}

ajax_get(host_addr, function(data){
  host = data;
  console.log('host: ' + host);
  ajax_get(host + '/api/gdriveid', function(resp) {
    gdriveid = JSON.parse(resp).gdriveid;
    console.log('gdriveid: ' + gdriveid);
  });
});
