var bg_page = chrome.extension.getBackgroundPage();

function trigger() {
  if (!bg_page.enabled) {
    bg_page.set_cookie();
    bg_page.enabled = true;
    document.getElementById('main_btn').innerHTML="关闭";

  } else {
    bg_page.remove_cookie();
    bg_page.enabled = false;
    document.getElementById('main_btn').innerHTML="启用";
  }
}

document.getElementById('main_btn').addEventListener('click', trigger);

document.getElementById('web_link').addEventListener('click', go_to_web);


document.addEventListener('DOMContentLoaded', function() {
  if (bg_page.enabled) {
    document.getElementById('main_btn').innerHTML="关闭";
  } else {
    document.getElementById('main_btn').innerHTML="启用";
  }
});

function go_to_web() {
  chrome.tabs.create({url: bg_page.host});
}
