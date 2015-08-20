var submit_single_task = function(download_link, success_callback, fail_callback, fatal_callback,try_count) {
	try_count = try_count || 0;
	if (try_count>15) {
		fatal_callback();
		return;
	}
	var callback = function(data) {
		if (data.status == 'OK') {
			success_callback(data);
		} else {
			fail_callback(data);
			submit_single_task(download_link, success_callback, fail_callback, fatal_callback,try_count+1);
		}
	};
	if (download_link.substr(0,8)!='magnet:?') {
		$.post('/api/commit_normal_task.do', {
			link : download_link
		}, function(data){
			callback(data);
		});
	} else {
		$.post('/api/commit_magnet.do', {
			magnet_link : download_link
		}, function(data){
			callback(data);
		});
	}
}

var submit_multi_task = function(download_links, prompt_func, success_callback, fail_callback, fatal_callback) {
	var task_array = download_links.split('\n');
	if (task_array.length>100) {
		alert('任務數量過多！');
		return;
	}
	for (index in task_array) {
		if (task_array[index].trim() == '') {
			continue;
		}
		prompt_func(task_array[index]);
		submit_single_task(task_array[index], success_callback, fail_callback, fatal_callback);
	}
}

var query_single_task = function(task_id, callback) {
	$.get('/api/task/' + encodeURIComponent(task_id), function(data){ 
		callback(data);
	});
}

var prompt_loading = function(download_link) {
	$('#prompt_div').append('正在提交任務: ' + escape_html(download_link) + '<br/>');
}

var output_single = function(data) {
	if (data.status == 'OK') {
		$('#prompt_div').append('任務查詢成功，正在输出下载地址' + '<br/>');
		for (index in data.records) {
			record = data.records[index];
			$('#output_links').val($('#output_links').val() + record.downurl + '\n');
		}
	} else if (data.status == 'Task Not Finished') {
		$('#prompt_div').append('任務未完成, 當前進度：' + data.progress + '<br/>');
	} else {
		$('#prompt_div').append('任務查詢失敗' + '<br/>');
	}
}

var single_success = function(data) {
	$('#prompt_div').append('任務提交成功, 任務ID為: ' + data.task_id + '<br/>');
	query_single_task(data.task_id, output_single);
}

var single_fail = function(data) {
	$('#prompt_div').append('任務提交失敗, Retrying...' + 'DEBUG=' + JSON.stringify(data.error) + '<br/>');
}

var single_fatal = function() {
	$('#prompt_div').append('任務提交失敗<br/>');
}

$(document).ready(function(){
	$(document).foundation();

	$('#submit_btn').click(function(){
		$('#prompt_div').html('');
		submit_multi_task($('#input_links').val(), prompt_loading, single_success, single_fail, single_fatal);
	});

	var gdriveid = '';
	$.get('/api/gdriveid', function(data){
		gdriveid = data.gdriveid;
		$('#gdriveid_div').html('離線服務器Cookies：gdriveid=' + gdriveid + '');
	});

});

function escape_html(string) {
	var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': '&quot;',
		"'": '&#39;',
		"/": '&#x2F;'
	};
	return String(string).replace(/[&<>"'\/]/g, function (s) {
		return entityMap[s];
	});
}
