try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}


var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

//获取并显示之前会话中保存的笔记
var notes = getAllNotes();
renderNotes(notes);



/*-----------------------------
      语音识别 
------------------------------*/

recognition.continuous = true;

recognition.onresult = function(event) {

  // event 是一个SpeechRecognitionEvent 对象
  // 保存了所有历史捕获对象 
  // 我们只取当前的内容
  var current = event.resultIndex;

  // 获取此前所说话的记录
  var transcript = event.results[current][0].transcript;

  // 将当前记录添加到笔记内容中
  // 解决安卓设备的bug
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
};

recognition.onstart = function() { 
  instructions.text('语音识别功能激活！请对着麦克风讲话。');
}

recognition.onspeechend = function() {
  instructions.text('长时间未说话，已自动关闭录音。');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('未检测到语音，请再试一次。');  
  };
}



/*-----------------------------
      应用功能按钮与输入 
------------------------------*/

$('#start-record-btn').on('click', function(e) {
  if (noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
});


$('#pause-record-btn').on('click', function(e) {
  recognition.stop();
  instructions.text('语音识别暂停。');
});

// 同步文本框文本与noteContent变量
noteTextarea.on('input', function() {
  noteContent = $(this).val();
})

$('#save-note-btn').on('click', function(e) {
  recognition.stop();

  if(!noteContent.length) {
    instructions.text('Could not save empty note. Please add a message to your note.');
  }
  else {
    // 保存笔记到localStorage
    saveNote(new Date().toLocaleString(), noteContent);

    // 重置变量，更新界面
    noteContent = '';
    renderNotes(getAllNotes());
    noteTextarea.val('');
    instructions.text('笔记保存成功。');
  }
      
})


notesList.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // 读出所选笔记
  if(target.hasClass('listen-note')) {
    var content = target.closest('.note').find('.content').text();
    readOutLoud(content);
  }

  // 删除笔记
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});



/*-----------------------------
      语音合成 
------------------------------*/

function readOutLoud(message) {
	var speech = new SpeechSynthesisUtterance();

  // 设置朗读内容和属性
	speech.text = message;
	speech.volume = 1;
	speech.rate = 1;
	speech.pitch = 1;
  
	window.speechSynthesis.speak(speech);
}



/*-----------------------------
      所需函数
------------------------------*/

function renderNotes(notes) {
  var html = '';
  if(notes.length) {
    notes.forEach(function(note) {
      html+= `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">读出笔记</a>
          <a href="#" class="delete-note" title="Delete">删除</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;    
    });
  }
  else {
    html = '<li><p class="content">暂无笔记</p></li>';
  }
  notesList.html(html);
}


function saveNote(dateTime, content) {
  localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if(key.substring(0,5) == 'note-') {
      notes.push({
        date: key.replace('note-',''),
        content: localStorage.getItem(localStorage.key(i))
      });
    } 
  }
  return notes;
}


function deleteNote(dateTime) {
  localStorage.removeItem('note-' + dateTime); 
}

