$(document).ready(function(){
	$(document).foundation();

	var missionData,gdriveid = '';
	var thunderFilenameMask = [0x61, 0x31, 0xe4, 0x5f, 0x00, 0x00, 0x00, 0x00];

	function wantedFile(ext){
		return $.inArray(ext,['mkv','mp4','mp3','wmv','exe','msi','dmg','pkg']) > -1 ? 'checked' : '' ;
	}

	function safeTitle(title){
		title = title.replace('\\/','/');
		return title.replace(/[\\\|\:\*\"\?\<\>]/g, "_");
	}
	function encodeUtf8(s) {
		return unescape(encodeURIComponent(s));
	}
	function toHex(num) {
		var s = num.toString(16);
		if (s.length == 1)
			return '0' + s;
		else
			return s;
	}
	function thunderFilenameEncode(filename){
		var result = ["01",];
		$.each(encodeUtf8(filename).split(''), function (i, n) {
			result.push(toHex(n.charCodeAt(0) ^ thunderFilenameMask[i % 8]).toUpperCase());
		});
		while (result.length % 8 != 1) {
			result.push(toHex(thunderFilenameMask[(result.length - 1) % 8]).toUpperCase());
		}
		return result.join("");
	}

	function url_rewrite(url, filename){
		url = url.replace(/&n=\w+/, "&n=" + thunderFilenameEncode(filename));
		return url;
	}

	$('#submit_task_btn').click(function(){
		$('#hint_submit').html('Loading...');
		$('#verify_code_image').attr('src', '/api/verify_code?time=' + Date.now());
		if ($('#magnet_input').val() === '') {
			$('#hint_submit').html('妳在逗我麽(ノ=Д=)ノ┻━┻ ');
			return;
		}
		if ($('#magnet_input').val().substr(0,8)!='magnet:?') {
			$.post('api/commit_normal_task.do', {
				link : $('#magnet_input').val(),
				verify_code : $('#verify_code_input').val(),
				verify_key : $.cookie('verify_key')
			}, function(data){
				if (data.status === 'OK') {
					$('#hint_submit').html('提交成功，任务ID为：' + data.task_id);
					$.cookie('task_id', data.task_id, {expires:30});
					$('#task_id_input').val(data.task_id);
					$('#submit_task_id_btn').click();
				} else {
					$('#hint_submit').html('出錯，請稍後重試 DEBUG = ' + JSON.stringify(data.error));
				}
			});
			return;
		}
		$.post('api/commit_magnet.do', {
			magnet_link : $('#magnet_input').val(),
			verify_code : $('#verify_code_input').val(),
			verify_key : $.cookie('verify_key')
		}, function(data){
			if (data.status === 'OK') {
				$('#hint_submit').html('提交成功，任务ID为：' + data.task_id);
				$.cookie('task_id', data.task_id, {expires:30});
				$('#task_id_input').val(data.task_id);
				$('#submit_task_id_btn').click();
			} else {
				$('#hint_submit').html('出錯，請稍後重試 DEBUG = ' + JSON.stringify(data.error));
			}
		})
	});

	$('#submit_task_id_btn').click(function(){
		$('#hint_task').html('<div style="color:red;">Loading...</div>');
		if ($('#task_id_input').val() == '') {
			$('#hint_task').html('<div style="color:red;">妳在逗我麽(ノ=Д=)ノ┻━┻ </div>');
			return;
		}
		$.get('api/task/' + encodeURIComponent($('#task_id_input').val()), function(data){
			if (data.status === 'OK') {
				$('#hint_task').html('任務已完成<br/>');
				$('#hint_task').append('<ul>');
				missionData = data;
				for (index in data.records) {
					record = data.records[index];
					$('#hint_task').append('<li><span style="display: inline-block;width: 95%" ><a target="_blank" href="' + record.downurl + '">' + record.title + ' ' + record.size + '</a> </span><span data-index="'+ index +'" ><input type="checkbox" '+ wantedFile(record.ext)+' /></span></li>');
				}
				$('#hint_task').append('</ul>')
			} else if (data.status === 'Task Not Found') {
				$('#hint_task').html('<div style="color:red;">任務ID無效</div>');
			} else if (data.status === 'Task Type Not Supported') {
				$('#hint_task').html('<div style="color:red;">任務類型尚不支持</div>');
			} else if (data.status === 'Task Not Finished') {
				$('#hint_task').html('<div style="color:red;">任務未完成，下次再來查詢哦！當前進度：' + data.progress + '%</div>');
			}
		});
	});

	$('#get_aria2_command').on('click',function(){
		var cmd='';
		$.each($('#hint_task input:checked'),function(){
			var index = $(this).parent().attr('data-index');
			if(!missionData.records[index]) return;

			var rec = missionData.records[index];
			cmd+='nohup aria2c  -c -s15 -x15 --stream-piece-selector=inorder --file-allocation=none --out ' + safeTitle(rec.title) + ' --header "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36" --header \'Cookie: gdriveid=' + gdriveid + ';\' "' + rec.downurl + "\" &\n\n";
			
		});

		if($('#aria2_cmd').size() > 0 ){
			$('#aria2_cmd').html(cmd);
		}else{
			$('<textarea id="aria2_cmd" style="height: 350px;" >'+cmd+'</textarea>').insertAfter('#gdriveid_div');
		}
		var ta = $('#aria2_cmd');
		ta.focus();
		$('body').animate({scrollTop:ta.offset().top},500);
		ta[0].select();
	});

	$('#get_aria2_file').on('click',function(){
		var str='';
		$.each($('#hint_task input:checked'),function(){
			var index = $(this).parent().attr('data-index');
			if(!missionData.records[index]) return;

			var rec = missionData.records[index];
			str+=rec.downurl + '\r\n  out=' + safeTitle(rec.title) + '\r\n  header=Cookie: gdriveid=' + gdriveid + '\r\n  header=User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36\r\n  continue=true\r\n  stream-piece-selector=inorder\r\n  file-allocation=none\r\n  max-connection-per-server=15\r\n  split=15\r\n\r\n';
		});
		var url = "data:text/html;charset=utf-8," + encodeURIComponent(str);
		var aLink = document.createElement('a');
		var evt = document.createEvent("HTMLEvents");
		evt.initEvent("click", false, false);//initEvent 不加后两个参数在FF下会报错
		aLink.download = 'aria2.down';
		aLink.href = url;
		aLink.dispatchEvent(evt);
	});

	$('#get_idm_file').on('click',function(){
		var str='';
		$.each($('#hint_task input:checked'),function(){
			var index = $(this).parent().attr('data-index');
			if(!missionData.records[index]) return;

			var rec = missionData.records[index];
			str += '<\r\n' + url_rewrite(rec.downurl, safeTitle(rec.title)) + '\r\ncookie: gdriveid=' + gdriveid + '\r\n>\r\n';
		});
		var url = "data:text/html;charset=utf-8," + encodeURIComponent(str);
		var aLink = document.createElement('a');
		var evt = document.createEvent("HTMLEvents");
		evt.initEvent("click", false, false);//initEvent 不加后两个参数在FF下会报错
		aLink.download = 'idm.ef2';
		aLink.href = url;
		aLink.dispatchEvent(evt);
	});
	$('#aria2_rpc').on('mouseover',function () {
		var rpcs = window.localStorage.getItem('rpcs') || '["http://127.0.0.1:6800/jsonrpc"]';
		var rpcsArr = JSON.parse(rpcs);
		var rpcContainer  = $('#aria2-rpcs');
		rpcContainer.html('<div class="small-12 columns" style="float: left;"> <div class="small-10 columns"><input class="rpc-addr" type="text" placeholder="格式類似: http://127.0.0.1:6800/jsonrpc"/></div><div class="small-2 columns"><button class="rpc-go button postfix">下載</button></div></div>');
		for ( i in rpcsArr){
			rpcContainer.prepend('<div class="small-12 columns" style="float: left;"> <div class="small-10 columns"><input class="rpc-addr" type="text" value="' + rpcsArr[i]+ '"/></div> <div class="small-2 columns"><button class="rpc-go button postfix">下載</button></div> </div>');
		}
		rpcContainer.slideDown();
	});

	$('body').on('click','.rpc-go',function () {
		var rpc = $(this).parent().prev().find('input').val();
		if (rpc){
			var nh = $('#notice-holder');
			$.each($('#hint_task input:checked'),function(){
				var index = $(this).parent().attr('data-index');
				if(missionData.records[index]){
					var rec = missionData.records[index];
					var postdata = {"jsonrpc":"2.0","method":"aria2.addUri","id":+(+(new Date())),"params":[[rec.downurl],{"parameterized-uri":"true","split":"15","max-connection-per-server":"15","seed-ratio":"1.0","header":'Cookie: gdriveid=' + gdriveid + ';',"out":safeTitle(rec.title)}]};
					var xhr = new XMLHttpRequest();
					xhr.open("POST", rpc + '?tm=' + (new Date()).getTime().toString(), true);
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
					xhr.send(JSON.stringify(postdata));
					$('<div class="large-12 columns"> <div data-alert class="alert-box info radius">已添加'+rec.title + '</div> </div>').appendTo(nh).fadeOut(4500);
				}
			});
		}

		var rpcsArr=[];
		$.each($('input.rpc-addr'),function () {
			var v = $(this).val();
			if (v)
				rpcsArr.push(v);
		});
		var rpcs = JSON.stringify(rpcsArr);
		window.localStorage.setItem('rpcs',rpcs);
	});

	$('.hide-rpc').on('mouseover',function () {
		$('#aria2-rpcs').slideUp();
	});

	$.get('api/gdriveid', function(data){
		gdriveid = data.gdriveid;
		$('#gdriveid_div').html('離線服務器Cookies：gdriveid=' + gdriveid + '');
	});

	if ($.cookie('task_id')!== undefined) {
		$('#task_id_input').val($.cookie('task_id'));
		$('#submit_task_id_btn').click();
	}
});