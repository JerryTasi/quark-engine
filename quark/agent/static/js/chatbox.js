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

document.addEventListener('DOMContentLoaded', function () {
  const fileSelect = document.getElementById('fileSelect');
  const diagramContainer = document.getElementById('diagram-container');
  const uploadIndicator = document.getElementById('upload-indicator');
  const uploadProgress = document.getElementById('upload-progress');
  const uploadText = uploadIndicator.querySelector('span');

  // if (!fileSelect || !diagramContainer || !uploadIndicator) {
  //   console.error('無法找到必要的 DOM 元素');
  //   return;
  // }

  // 修改文件選擇功能
  fileSelect.addEventListener('click', function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = handleFileSelect;
    input.click();
  });

  // 新增的拖放功能，現在應用於 diagram-container
  diagramContainer.addEventListener('dragenter', function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadIndicator.style.display = 'flex';
  });

  diagramContainer.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = 'rgba(74, 74, 74, 0.5)';
    uploadIndicator.style.display = 'flex';
  });

  diagramContainer.addEventListener('dragleave', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = 'rgba(128, 128, 128, 0.4)';
    uploadIndicator.style.display = 'none';
  });

  diagramContainer.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = 'rgba(128, 128, 128, 0.4)';
    uploadIndicator.style.display = 'flex';
    uploadText.textContent = '正在上傳...';

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

  // 修改文件上傳函數
  let nextNodeId = 200;  // 初始化 nodeId

  function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    // 顯示上傳指示器和進度條
    uploadIndicator.style.display = 'flex';
    uploadProgress.style.display = 'block';
    uploadText.textContent = 'Uploading...';
    let progress = 0;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/fileUpload', true);

    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        progress = (e.loaded / e.total) * 100;
        updateProgress(progress);
      }
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log('File uploaded successfully:', data);

        // 新增節點
        const nodeId = nextNodeId++;
        const title = file.name;
        newFileNode = addNewFileNode(nodeId, title, 2, 3);

        // 隱藏上傳指示器和進度條
        uploadIndicator.style.display = 'none';
        uploadProgress.style.display = 'none';
        uploadText.textContent = 'Drag and drop your file here to upload';
      } else {
        console.error('File upload error:', xhr.statusText);
      }
    };

    xhr.onerror = function () {
      console.error('File upload error');
      // 隱藏上傳指示器和進度條
      uploadIndicator.style.display = 'none';
      uploadProgress.style.display = 'none';
    };

    xhr.send(formData);
  }

  function updateProgress(progress) {
    const degrees = 3.6 * progress;
    uploadProgress.style.background = `conic-gradient(#0f0 ${degrees}deg, transparent ${degrees}deg)`;
  }
});