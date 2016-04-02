from login import thunder_login
import requests

if __name__ == '__main__':
	thunder_login()
	print('Enter auth_key:')
	auth_key = raw_input()
	request_result = requests.get('https://raw.githubusercontent.com/Chion82/Chion82.github.io/master/server_host')
	host = request_result.text.replace('\n','')
	result = requests.post(host + '/api/update_cookie.do', data={
		'auth_key':auth_key, 
		'cookie': str(open('cookie.txt', 'r').read())
		})
	print(result.text)
