/*global CodeMirror*/
/*global marked*/
/*global DOMPurify*/

var textBox = document.getElementById("textBox");
var codeBox = document.getElementById("codeBox");
var message = document.getElementById("message");
var send = document.getElementById("send");
var copyButton = document.getElementById("copyButton");
var languageLabel = document.getElementById("languageLabel");

// Initialize CodeMirror with dark theme
var codeMirror = new CodeMirror(codeBox, {
  // lineNumbers: true,
  padding: 10,
  theme: "dracula",
  readOnly: false,
  backgroundColor: "#fff",
});

function detectLanguage(code) {
  const patterns = {
    xml: /^\s*<!DOCTYPE html>|<html/,
    clike: /^\s*#include|int\s+main\s*\(/,
    python: /^\s*def\s+|import\s/,
    javascript: /^\s*(function|var|let|const)\s+/.test(code) || /console\.log/.test(code)
  };

  for (const [language, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) {
      return language;
    }
  }

  return "plaintext";
}

codeMirror.on("change", function (instance) {
  var code = instance.getValue();
  var detectedLanguage = detectLanguage(code);
  instance.setOption("mode", detectedLanguage);
});

send.addEventListener("click", function () {
  var userMessage = message.value;
  var userDiv = document.createElement("div");

  userDiv.className = "message user";
  userDiv.innerHTML = DOMPurify.sanitize(marked.parse(userMessage)); // eslint-disable-line

  textBox.appendChild(userDiv);
  textBox.scrollTop = textBox.scrollHeight;

  message.value = "";

  fetch("/get_response?message=" + encodeURIComponent(userMessage))
    .then(function (response) {
      return response.json();
    })
    .then(function (botMessage) {
      var textDiv = document.createElement("div");

      textDiv.className = "message bot";
      textDiv.innerHTML = DOMPurify.sanitize(marked.parse(botMessage.plain_text)); // eslint-disable-line

      textBox.appendChild(textDiv);

      if (botMessage.code_blocks.length > 0) {
        codeBox.style.display = "block";
        //textBox.style.width = "49%";
        var codeLines = botMessage.code_blocks.join("\n").split("\n").slice(1).join("\n");
        codeMirror.setValue(codeLines);
        codeMirror.setOption("mode", detectLanguage(botMessage.code_blocks.join("\n\n\n")));
      } else {
        codeBox.style.display = "none";
        //textBox.style.width = "100%";
      }

      processNodesAndLinks(botMessage.flowdata);

      textBox.scrollTop = textBox.scrollHeight;
    });
});

var isComposing = false;


message.addEventListener("compositionstart", function () {
  isComposing = true;
});

message.addEventListener("compositionend", function () {
  isComposing = false;
});


message.addEventListener("keydown", function (event) {
  const keyCode = event.which || event.keyCode;
  if (keyCode === 13 && !event.shiftKey) {
    event.preventDefault();
    send.click();
  }
});

const codeblockButton = document.getElementById('codeblock-button');

function showCodeBlock() {
  if (codeBox.style.display === "none") {
    codeBox.style.display = "block";
    codeblockButton.style.color = "#008";
  } else {
    codeBox.style.display = "none";
    codeblockButton.style.color = "#000";
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const fileSelect = document.getElementById('fileSelect');
  const selectedFileName = document.getElementById('selectedFileName');
  const fileUploadContainer = document.getElementById('fileUploadContainer');
  const textBox = document.getElementById('textBox');

  // 修改文件選擇功能
  fileSelect.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = handleFileSelect;
    input.click();
  });

  // 新增的拖放功能
  textBox.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = '#4a4a4a';
  });

  textBox.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = '';
  });

  textBox.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = '';

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect({ target: { files: e.dataTransfer.files } });
    }
  });

  // 修改處理文件選擇的函數
  function handleFileSelect(event) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // 直接上傳文件
      uploadFile(selectedFile);
    }
  }

  // 新增文件上傳函數
  function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    fetch('/fileUpload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      console.log('文件上傳成功:', data);
    })
    .catch(error => {
      console.error('文件上傳錯誤:', error);
    });
  }
});
