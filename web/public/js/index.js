$(document).ready(function(){
	$(document).foundation();

	$('#submit_task_btn').click(function(){
		$('#hint_submit').html('Loading...');
		if ($('#magnet_input').val() == '') {
			$('#hint_submit').html('妳在逗我麽(ノ=Д=)ノ┻━┻ ');
			return;
		}
		if ($('#magnet_input').val().substr(0,8)!='magnet:?') {
			$.post('/api/commit_normal_task.do', {
				link : $('#magnet_input').val()
			}, function(data){
				if (data.status == 'OK') {
					$('#hint_submit').html('提交成功，任务ID为：' + data.task_id);
					$.cookie('task_id', data.task_id, {expires:30});
					$('#task_id_input').val(data.task_id);
					$('#submit_task_id_btn').click();
				} else {
					$('#hint_submit').html('出錯，請稍後重試 DEBUG = ' + JSON.stringify(data.error));
				}
			})
			return;
		}
		$.post('/api/commit_magnet.do', {
			magnet_link : $('#magnet_input').val()
		}, function(data){
			if (data.status == 'OK') {
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
		$.get('/api/task/' + encodeURIComponent($('#task_id_input').val()), function(data){
			if (data.status == 'OK') {
				$('#hint_task').html('任務已完成<br/>');
				$('#hint_task').append('<ul>')
				for (index in data.records) {
					record = data.records[index];
					$('#hint_task').append('<li><a target="_blank" href="' + record.downurl + '">' + record.title + ' ' + record.size + '</a></li>');
				}
				$('#hint_task').append('</ul>')
			} else if (data.status == 'Task Not Found') {
				$('#hint_task').html('<div style="color:red;">任務ID無效</div>');
			} else if (data.status == 'Task Type Not Supported') {
				$('#hint_task').html('<div style="color:red;">任務類型尚不支持</div>');
			} else if (data.status == 'Task Not Finished') {
				$('#hint_task').html('<div style="color:red;">任務未完成，下次再來查詢哦！當前進度：' + data.progress + '%</div>');
			}
		});
	});

	var gdriveid = '';
	$.get('/api/gdriveid', function(data){
		gdriveid = data.gdriveid;
		$('#gdriveid_div').html('離線服務器Cookies：gdriveid=' + gdriveid + '');
	});

	if ($.cookie('task_id')!= undefined) {
		$('#task_id_input').val($.cookie('task_id'));
		$('#submit_task_id_btn').click();
	}
});