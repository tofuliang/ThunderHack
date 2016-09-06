# -*- coding: UTF-8 -*-

import requests
from urllib import quote
import re
import json
from flask import Flask, request, jsonify, redirect, make_response
import datetime
import thread, time, os

def get_backendHost():
    session = requests.session()
    request_result = session.get('https://raw.githubusercontent.com/Chion82/Chion82.github.io/master/server_host')
    open('backendHost', 'wb+').write(request_result.content)
    
def reload_config(refresh_host=False):
        if refresh_host == False:
            try:
                if time.time() - os.path.getmtime('backendHost') > 60:
                    print('Re-geting backendHost ...')
                    get_backendHost()
            except Exception:
                print('geting backendHost ...')
                get_backendHost()
        
        app.config['backendHost']=str(open('backendHost','rb').read()).replace('\n','')
        user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'
        session = requests.session()
        session.headers.update({'User-Agent':user_agent})
        app.config['ThunderHack_session'] = session


app = Flask(__name__, static_folder='public', static_url_path='')

@app.route('/api/reload.do')
def API_reload_config():
        reload_config()
        return jsonify({'status':'OK'})

@app.route('/api/commit_magnet.do', methods=['POST'])
def API_commit_magnet_task():
        try:
            payload={}
            session = app.config['ThunderHack_session']
            payload['magnet_link'] = request.form['magnet_link']
            if 'verify_code' in request.form:
                payload['verify_code'] = request.form['verify_code']
                payload['verify_key'] = request.form['verify_key']
            request_result = session.post(app.config['backendHost']+'/api/commit_magnet.do', data=payload)
            content=jsonify(json.loads(request_result.content))
            return content
        except Exception,Argument:
            print(Exception)
            print(Argument)
            return jsonify({'status':'Failed', 'error':'转发请求失败'})

@app.route('/api/commit_normal_task.do', methods=['POST'])
def API_commit_normal_task():
        try:
            payload={}
            session = app.config['ThunderHack_session']
            payload['link'] = request.form['link']
            if 'verify_code' in request.form:
                payload['verify_code'] = request.form['verify_code']
                payload['verify_key'] = request.form['verify_key']
            request_result = session.post(app.config['backendHost']+'/api/commit_normal_task.do', data=payload)
            content=jsonify(json.loads(request_result.content))
            return content
        except Exception,Argument:
            print(Exception)
            print(Argument)
            return jsonify({'status':'Failed', 'error':'转发请求失败'})

@app.route('/api/task/<task_id>', methods=['GET'])
def API_get_task_info(task_id):
        try:
            session = app.config['ThunderHack_session']
            request_result = session.get(app.config['backendHost']+'/api/task/' + str(task_id))
            content=jsonify(json.loads(request_result.content))
            return content
        except Exception,Argument:
            print(Exception)
            print(Argument)
            return jsonify({'status':'Failed', 'error':'转发请求失败'})

@app.route('/api/gdriveid', methods=['GET'])
def API_get_gdriveid():
        try:
            session = app.config['ThunderHack_session']
            request_result = session.get(app.config['backendHost']+'/api/gdriveid')
            content=jsonify(json.loads(request_result.content))
            return content
        except Exception,Argument:
            print(Exception)
            print(Argument)
            return jsonify({'status':'Failed', 'error':'转发请求失败'})

@app.route('/api/verify_code', methods=['GET'])
def API_get_verify_code():
        reload_config(True)
        session = app.config['ThunderHack_session']
        image_result = session.get(app.config['backendHost']+'/api/verify_code')
        resp = make_response(str(image_result.content))
        resp.headers['Content-Type'] = 'image/jpeg'
        resp.headers['Verify-Key'] = image_result.cookies['verify_key']
        resp.set_cookie('verify_key', image_result.cookies['verify_key'])
        return resp

@app.route('/api/update_cookie.do', methods=['POST'])
def API_update_cookie():
        try:
            session = app.config['ThunderHack_session']
            request_result = session.post(app.config['backendHost']+'/api/update_cookie.do')
            content=jsonify(json.loads(request_result.content))
            return content
        except Exception,Argument:
            print(Exception)
            print(Argument)
            return jsonify({'status':'Failed', 'error':'转发请求失败'})

@app.route('/')
def index():
        return '<script>window.location.href="index.html"</script>'

if __name__ == '__main__':
        reload_config()        #TODO: Set the argument to True if debugging
        app.run(host='0.0.0.0', port=90, debug=True)

def run_app(environ, start_response):
    #reload_config()
    return app(environ, start_response)
