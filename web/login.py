import requests
from urllib import quote, unquote
import re
import json

PASSWORD_ENCRYPT_HOST = 'http://localhost:3000'

def thunder_login():
	#Load login info from configuration JSON file
	config_raw = open('login_info.json', 'rb').read()
	config = json.loads(config_raw)
	email = config['email']
	password = config['password']

	user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.125 Safari/537.36'

	session = requests.session()
	session.headers.update({'User-Agent':user_agent})

	#User check request
	request_result = session.get('https://login2.xunlei.com/check/?u=' + quote(email) + '&business_type=108')
	
	#Get RSA-encrypted password
	request_url = PASSWORD_ENCRYPT_HOST + '/api/crypto/rsa_encrypt.do?check_n=' + request_result.cookies['check_n'] + '&check_e=' + quote(request_result.cookies['check_e']) + '&captcha=' + quote(request_result.cookies['check_result'].split(':')[1]) + '&pwd=' + quote(password)
	encrypted_password = json.loads(requests.get(request_url).text)['encrypted_pwd']
	
	#login request
	login_result_raw = session.post('https://login2.xunlei.com/sec2login/', {
			'p' : encrypted_password,
			'u' : email,
			'n' : unquote(request_result.cookies['check_n']),
			'e' : request_result.cookies['check_e'],
			'verifycode' : request_result.cookies['check_result'].split(':')[1],
			'login_enable' : 0,
			'business_type' : 108,
			'v' : 100
		})
	cookies = get_cookies(login_result_raw.cookies)

	#Enter home page to get gdriveid
	home_page_result_raw = session.get('http://dynamic.cloud.vip.xunlei.com/user_task?st=4&userid=' + quote(cookies['userid']))
	match_result = re.search(r'<input type="hidden" id="cok" value="(.*?)" />', str(home_page_result_raw.content))
	if (not match_result):
		print('Login Failed.')
		return
	gdriveid = match_result.group(1)
	cookies['gdriveid'] = gdriveid
	save_cookies(cookies)
	print('Sucessfully logged in.')

	
def get_cookies(cookies):
	cookies_dict = {}
	for key, value in cookies.get_dict().iteritems():
		#print(key + " : " + value)
		cookies_dict[key] = value
	return cookies_dict

def save_cookies(cookies_dict):
	buf = ''
	for key,value in cookies_dict.iteritems():
		buf = buf + (key + '=' + value + '; ')
	open('cookie.txt', 'wb+').write(buf)
