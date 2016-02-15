# -*- coding: UTF-8 -*-

import requests
from urllib import quote
import re
import json
from flask import Flask, request, jsonify, redirect
from login import thunder_login
import datetime
import thread, time, os

def query_bt_info(download_link, retry=10):
	reload_config(True)
	session = app.config['thunder_session']
	if (retry <= 0):
		raise Exception('BTQueryError')
	try:
		request_result = session.get('http://dynamic.cloud.vip.xunlei.com/interface/url_query?callback=queryUrl&u=' + quote(download_link))
		match = re.search(r"queryUrl\(1,'(?P<cid>.*?)','.*?','(?P<btname>.*?)','.*?',new Array\(.*?\),new Array\(.*?\),new Array\(.*?\),new Array\(.*?\),new Array\(.*?\),new Array\((?P<findex>.*?)\),new Array\(.*?\),.*?,.*?\)", str(request_result.content))
		cid = match.group('cid')
		btname = match.group('btname')
		findex_raw = match.group('findex')
		findex = findex_raw.replace("'",'').replace(',','_')
		print('cid : ' + cid)
		print('btname : ' + btname)
		print('findex : ' + findex)
		return {'cid':cid,'btname':btname,'findex':findex}
	except Exception:
		return query_bt_info(download_link, retry-1)

def commit_bt_task(bt_info, retry=10):
	reload_config(True)
	session = app.config['thunder_session']
	uid = app.config['thunder_uid']
	if (retry <= 0):
		return {'status':'Failed', 'error':'提交失败，请重试。'}
	payload = {
		'uid' : uid,
		'btname' : bt_info['btname'],
		'cid' : bt_info['cid'],
		'goldbean' : 0,
		'silverbean' : 0,
		'findex' : bt_info['findex']
	}
	try:
		request_result = session.post('http://dynamic.cloud.vip.xunlei.com/interface/bt_task_commit?callback=jsonp', data=payload)
		result_json = str(request_result.content)[6:]
		result_json = result_json[0:len(result_json)-1]
		result = json.loads(result_json)
		if ('id' in result):
			if (len(result['id'])>5):
				return {'status':'OK','task_id':str(result['id'])}
		if '"progress":-12' in str(request_result.content):
			raise Exception('CommitFailed')
		return {'status':'Failed', 'error':result}
	except Exception:
		return commit_bt_task(bt_info, retry-1)

def commit_normal_task(url, retry=10):
	reload_config(True)
	session = app.config['thunder_session']
	uid = app.config['thunder_uid']
	if (retry <= 0):
		return {'status':'Failed', 'error':'提交失败，请重试。'}
	try:
		result = session.get('http://dynamic.cloud.vip.xunlei.com/interface/task_commit?callback=ret_task&uid=' + uid + '&url=' + quote(url))
		match = re.search(r'ret_task\(.*?,\'(.*?)\',\'.*?\'\)', str(result.content))
		if (not match):
			if '"progress":-12' in str(request.content):
				raise Exception('CommitFailed')
			return {'status' : 'Failed', 'error': str(result.content)}
		else:
			return {'status' : 'OK', 'task_id' : str(match.group(1))}
	except Exception:
		return commit_normal_task(url, retry-1)

def find_task(task_id):
	reload_config(True)
	session = app.config['thunder_session']
	page = 1
	while page <= 10:
		try:
			request_result = session.get('http://dynamic.cloud.vip.xunlei.com/interface/showtask_unfresh?callback=jsonp&type_id=4&page=' + str(page) + '&tasknum=30&p=' + str(page) + '&interfrom=task')
		except Exception:
			continue
		result_json = str(request_result.content)[6:]
		result_json = result_json[0:len(result_json)-1]
		result = json.loads(result_json)
		if (result['rtcode'] != 0):
			return {'status':'Failed', 'error': result}
		for task in result['info']['tasks']:
			if (str(task['id']) == task_id):
				return {'status':'OK', 'task':task}
		page = page + 1

	return {'status':'Task Not Found'}

def get_task(task_info):
	reload_config(True)
	session = app.config['thunder_session']
	uid = app.config['thunder_uid']
	if (task_info['progress'] != 100):
		return {'status':'Task Not Finished', 'progress': task_info['progress']}
	if (task_info['filetype'] != 'TORRENT'):
		return {'status':'OK', 'records': [{
			'title':task_info['taskname'],
			'downurl' : task_info['lixian_url'],
			'size' : task_info['filesize']
		}]}
	page = 1
	all_records = []
	while True:
		try:
			request_result = session.get('http://dynamic.cloud.vip.xunlei.com/interface/fill_bt_list?callback=fill_bt_list&tid=' + task_info['id'] + '&infoid=' + task_info['cid'] + '&g_net=1&p=' + str(page) + '&uid=' + uid + '&interfrom=task')
		except Exception:
			continue
		result_json = str(request_result.content)[13:]
		result_json = result_json[0:len(result_json)-1]
		result = json.loads(result_json)

		try:
			for record in result['Result']['Record']:
				all_records.append(record)
			if len(result['Result']['Record']) >= result['Result']['btpernum']:
				page = page + 1
			else:
				break
		except Exception:
			break

	return {'status':'OK', 'records':all_records}

def reload_config(from_file=False):
	if from_file == False:
		try:
			if time.time() - os.path.getmtime('cookie.txt') > 60:
				print('Re-login...')
				thunder_login()
		except Exception:
			print('cookie.txt not found. Generating.')
			thunder_login()
	user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.125 Safari/537.36'
	cookie = str(open('cookie.txt','rb').read()).replace('\n','')
	app.config['thunder_cookie'] = cookie
	session = requests.session()
	session.headers.update({'Cookie':cookie, 'User-Agent':user_agent})
	app.config['thunder_session'] = session
	app.config['thunder_uid'] = re.search(r'userid=(\w+?);', cookie).group(1)
	app.config['thunder_gdriveid'] = re.search(r'gdriveid=(\w+?);', cookie).group(1)

app = Flask(__name__, static_folder='public', static_url_path='')

@app.route('/api/reload.do')
def API_reload_config():
	reload_config()
	return jsonify({'status':'OK'})

@app.route('/api/commit_magnet.do', methods=['POST'])
def API_commit_magnet_task():
	try:
		bt_info = query_bt_info(request.form['magnet_link'])
		commit_result = commit_bt_task(bt_info)
		return jsonify(commit_result)
	except Exception:
		return jsonify({'status':'Failed', 'error':'无法解析的下载链接'})

@app.route('/api/commit_normal_task.do', methods=['POST'])
def API_commit_normal_task():
	return jsonify(commit_normal_task(request.form['link']))

@app.route('/api/task/<task_id>', methods=['GET'])
def API_get_task_info(task_id):
	task_info = find_task(task_id)
	if (task_info['status'] != 'OK'):
		return jsonify(task_info)
	else:
		task_records = get_task(task_info['task'])
		return jsonify(task_records)

@app.route('/api/gdriveid', methods=['GET'])
def API_get_gdriveid():
	return jsonify({'gdriveid':app.config['thunder_gdriveid']})

@app.route('/')
def index():
	return '<script>window.location.href="index.html"</script>'

if __name__ == '__main__':
	reload_config()
	app.run(host='0.0.0.0', port=90, debug=True)

def run_app(environ, start_response):
    #reload_config()
    return app(environ, start_response)
