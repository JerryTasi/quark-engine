// 初始化 JSON 物件
let jsonData = {
    nodes: {
        node1: { label: "Define the behavior 'Construct Cryptographic Key' in the rule instance." },
    },
    links: [
    ]
};

let isDragging = false;  // 用於追蹤是否正在拖動
let isMouseOver = false;
var flowData = {};
// 測試修改 `links`

// 定義監聽回調函式
function onLinksChange() {
    

    // 發送 REST request 至 Flask 伺服器
    fetch('/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)  // 你可以自定義需要發送的內容
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (responseMessage) {
            var textDiv = document.createElement("div");

            textDiv.className = "message bot";
            textDiv.innerHTML = responseMessage.plain_text + "<br><br>";

            textBox.appendChild(textDiv);

            textBox.scrollTop = textBox.scrollHeight;
        })
        .catch(error => console.error("Error:", error));
}


var nodes = {};

// 創建 JointJS 畫布
const graph = new joint.dia.Graph();
const width = document.getElementById('diagram-container').width;
const paper = new joint.dia.Paper({
    el: document.getElementById('diagram-container'),
    model: graph,
    width: 2000, height: 2000,
    drawGrid: true,
    gridSize: 10,
    linkPinning: false,
    background: {
        color: 'rgba(128, 128, 128, 0.4)' // 灰色 (RGB 128,128,128) 且透明度 40%
    },

    validateConnection: function (cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
        return cellViewS !== cellViewT
    },
    validateMagnet: function (cellView, magnet) {
        // Note that this is the default behaviour. It is shown for reference purposes.
        // Disable linking interaction for magnets marked as passive
        return magnet.getAttribute('magnet') !== 'passive';
    },
    snapLinks: { radius: 20 },


    linkDefaults: {
        attrs: {
            line: {
                stroke: 'white',
                strokeWidth: 2
            }

        }
    }
});

paper.setGrid({ name: 'mesh', args: { color: 'hsla(212, 7%, 50%, 0.5)' } });

var paperHeight = paper.getComputedSize().height;
var paperCenterY = (paperHeight / 2) - 25;

var papaerWidth = paper.getComputedSize().width;
var paperCenterX = (papaerWidth / 2) - 75;

let selectedElement = null;
let firstNode = null; // 用于存储连结线的起点

joint.dia.Link.define('standard.Link', {
    router: {
        name: 'manhattan',
        args: {
            step: 50,
        }
    },
    connector: {
        name: 'rounded',
        args: {
            radius: 50,
        },
    },
    attrs: {
        line: {
            connection: true,
            stroke: '#fff',
            strokeWidth: 2,
            strokeLinejoin: 'round',
            targetMarker: {
                'type': 'path',
                'd': 'M 10 -5 0 0 10 5 z'
            },
        },
        wrapper: {
            connection: true,
            strokeWidth: 10,
            strokeLinejoin: 'round'
        }
    }
}, {
    markup: [{
        tagName: 'path',
        selector: 'wrapper',
        attributes: {
            'fill': 'none',
            'cursor': 'pointer',
            'stroke': 'transparent'
        }
    }, {
        tagName: 'path',
        selector: 'line',
        attributes: {
            'fill': 'none',
            'pointer-events': 'none'
        }
    }]
});


var toolsView = new joint.dia.ToolsView({
    tools: [
        removeButton
    ]
});


paper.on('element:mouseenter', function (elementView, evt) {
    isMouseOver = true;
    setTimeout(() => {

        if (isDragging || !isMouseOver) {
            return;
        }
    
        elementView.model.toFront();

        var outboundLinks = graph.getConnectedLinks(elementView.model, { outbound: true })
        if (outboundLinks.length == 0) {

            // 先移除之前可能生成的額外元素
            const suggestionBox = document.getElementById('suggestion-box');
            if (suggestionBox) {
                suggestionBox.remove();
            }

            stepChain = []
            Object.values(nodes).forEach(node => {
                stepChain.push(node.get('fullText'))
            });

            // elementView.model.attr('label/text', stepChain.join('\n'))

            elementX = elementView.model.get('position').x
            elementY = elementView.model.get('position').y
            elementWidth = elementView.model.get('size').width
            elementHeight = elementView.model.get('size').height
            reactCenterX = elementView.model.get('size').width / 2
            reactCenterY = elementView.model.get('size').height / 2

            const clientPoint = paper.localToClientPoint(elementX, elementY)

            fetch('/getSuggestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stepChain: stepChain
                })
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (responseMessage) {
                    // 建立矩形框
                    const suggestionBox = document.createElement('div');

                    suggestionBox.id = 'suggestion-box';
                    suggestionBox.style.position = 'absolute';
                    // suggestionBox.style.border = '2px dashed white'; // 虛線方框
                    suggestionBox.style.padding = '10px';
                    suggestionBox.style.left = `${clientPoint.x + 350}px`; // 距離右方100px
                    suggestionBox.style.display = 'flex';
                    suggestionBox.style.flexDirection = 'column'; // 按鈕垂直排列

                    // 根據 stepChain 內容動態生成按鈕
                    responseMessage.suggestion.forEach(action => {
                        const suggestionBtn = document.createElement('button');
                        suggestionBtn.classList.add('suggestion-btn')
                        suggestionBtn.textContent = action.label;

                        suggestionBox.appendChild(suggestionBtn);

                        const suggestionConnection = new joint.shapes.standard.Link({
                            router: { name: 'manhattan', args: { step: 10, } },
                            connector: { name: 'rounded', args: { radius: 50, }, },
                        });

                        suggestionBtn.addEventListener('mouseover', function () {
                            suggestionConnection.source(elementView.model, { "port": "right" });
                            const suggestionBtnRect = suggestionBtn.getBoundingClientRect();
                            const targetPoint = paper.clientToLocalPoint(suggestionBtnRect.left, suggestionBtnRect.top)
                            suggestionConnection.target({ x: targetPoint.x, y: targetPoint.y + suggestionBtnRect.height / 2 });
                            suggestionConnection.addTo(graph);
                        });

                        suggestionBtn.addEventListener('mouseleave', function () {
                            suggestionConnection.remove()
                        });

                        suggestionBtn.addEventListener('click', function () {
                            // 當按鈕被點擊時，將其內容添加到 elementView 的 label
                            newNode = callAddNewNode(
                                action.id, 
                                suggestionBtn.textContent, 
                                suggestionBtn.textContent,
                                elementX+200,
                                elementY+150
                            )
                            addLink(elementView.model, newNode)
                            touchBox.remove();
                            suggestionBox.remove();
                            suggestionConnection.remove()
                        });

                    });

                    // 將矩形框加入到文件中
                    document.body.appendChild(suggestionBox);

                    const suggestionDiv = document.getElementById('suggestion-box')

                    document.getElementById('suggestion-box').style.top = `${clientPoint.y + reactCenterY - (suggestionDiv.clientHeight / 2)}px`

                    const touchBox = document.createElement('div');
                    touchBox.id = 'touch-box'
                    touchBox.style.position = 'absolute';
                    touchBox.style.top = `${clientPoint.y}px`
                    touchBox.style.left = `${clientPoint.x}px`
                    touchBox.style.width = `${elementWidth + 100}px`
                    touchBox.style.height = `${elementHeight}px`

                    document.body.appendChild(touchBox)

                    touchBox.addEventListener('mouseleave', function () {
                        if (!touchBox.contains(event.relatedTarget) && !suggestionBox.contains(event.relatedTarget)) {
                            // 如果滑鼠同時不在 touchBox 和 suggestionBox 中，移除它們
                            touchBox.remove();
                            suggestionBox.remove();
                        }
                    });

                    // 添加鼠标移出事件监听器
                    suggestionBox.addEventListener('mouseleave', function () {
                        // 当鼠标移出时，移除 extraElement
                        if (!touchBox.contains(event.relatedTarget) && !suggestionBox.contains(event.relatedTarget)) {
                            // 如果滑鼠同時不在 touchBox 和 suggestionBox 中，移除它們
                            touchBox.remove();
                            suggestionBox.remove();
                        }
                    });

                })
                .catch(error => console.error("Error:", error));

        }

    }, 1000);
    const fullText = elementView.model.get("fullText")
    // const fullText = 'This is an example of a very long description that exceeds 20 characters';
    // Create a tooltip and append it to the document
    const tooltip = document.createElement('div');
    tooltip.className = '';
    tooltip.textContent = fullText;
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.left = `${evt.clientX + 10}px`;
    tooltip.style.top = `${evt.clientY + 20}px`;

    document.body.appendChild(tooltip);

    // Remove tooltip on mouseout
    elementView.on('element:mouseout', function () {
        tooltip.remove();
    });
});


paper.on('link:mouseenter', function (linkView) {
    linkView.addTools(toolsView);
});

paper.on('link:mouseleave', function (linkView) {
    linkView.removeTools();
});

paper.on('element:mouseenter', function (element) {
    setPortsVisibility(element, 'visible');
});

paper.on('element:mouseleave', function (element) {
    setPortsVisibility(element, 'hidden');
    isDragging = false;
    isMouseOver = false;
});

paper.on('link:snap:connect', function (linkView, evt, elementViewConnected, magnet, arrowhead) {

    const sourceId = linkView.model.get('source').id;
    const targetId = linkView.model.get('target').id;
    console.log(sourceId, targetId)

    fetch('/add_link', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            source: sourceId,
            target: targetId
        })
    })
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
                textBox.style.width = "49%";
                var codeLines = botMessage.code_blocks.join("\n").split("\n").slice(1).join("\n");
                codeMirror.setValue(codeLines);
                codeMirror.setOption("mode", detectLanguage(botMessage.code_blocks.join("\n\n\n")));
            } else {
                codeBox.style.display = "none";
            }
            textBox.scrollTop = textBox.scrollHeight;
        })
        .catch(error => console.error("Error:", error));
})

function setPortsVisibility(element, visibility) {
    element.model.prop('ports/groups/top/attrs/portBody/visibility', visibility)
    element.model.prop('ports/groups/bottom/attrs/portBody/visibility', visibility)
    element.model.prop('ports/groups/left/attrs/portBody/visibility', visibility)
    element.model.prop('ports/groups/right/attrs/portBody/visibility', visibility)
}

graph.on('change:position', function (cell, opt) {
    // if (cell.isLink()) return;
    // autosize(cell);
    isDragging = true;

});

function autosize(element) {
    var view = paper.findViewByModel(element);
    var text = view.findBySelector('label')[0];
    if (text) {
        var padding = 50;
        // Use bounding box without transformations so that our auto-sizing works
        // even on e.g. rotated element.
        var bbox = text.getBBox();
        // Give the element some padding on the right/bottom.
        element.resize(bbox.width + padding, bbox.height + padding);
    }
}

async function processNodesAndLinks(flowData) {

    // paper.model.clear();
    var paperWidth = paper.getComputedSize().width;
    var nodeCount = Object.keys(flowData.nodes).length;
    var spacing = 10 + paperHeight / 15;
    var i = 1;
    var x = 0;

    const sortedNodes = Object.entries(flowData.nodes).sort(([, a], [, b]) => a.no - b.no);
    const sortedNodesObj = Object.fromEntries(sortedNodes);

    for (const nodeId in sortedNodesObj) {
        const node = flowData.nodes[nodeId];
        posY = (spacing * i);
        posX = (spacing + 230 * i) - 300;
        i = i + 1;

        // remove flowdata node
        // delete flowData.nodes[nodeId];

        await addNewNode(nodeId, node.label, posX, posY);
    }

    for (const link of flowData.links) {
        let sourceNode = nodes[link.source]
        let targetNode = nodes[link.target]
        await addLink(sourceNode, targetNode);
    }
}

var isComposing = false;


message.addEventListener("compositionstart", function () {
    isComposing = true;
});

message.addEventListener("compositionend", function () {
    isComposing = false;
});

const buttonContainer = document.getElementById('buttonContainer');
const button = document.getElementById('new-action-button');

function callButtonContainer() {
    if (buttonContainer.classList.contains('hidden')) {
        buttonContainer.classList.remove('hidden');
        buttonContainer.classList.add('show');
        loadJson();
        button.textContent = "-";
    } else {
        buttonContainer.classList.remove('show');
        buttonContainer.classList.add('hidden');
        button.textContent = "+";
    }
}

function callAddNewNode(nodeId, title, description, posX=0, posY=0) {

    newNode = addNewNode(nodeId, title, posX, posY);
    fetch('/add_analyze_step', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            node: description,
            nodeId: newNode.id
        })
    })
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
                textBox.style.width = "49%";
                var codeLines = botMessage.code_blocks.join("\n").split("\n").slice(1).join("\n");
                codeMirror.setValue(codeLines);
                codeMirror.setOption("mode", detectLanguage(botMessage.code_blocks.join("\n\n\n")));
            } else {
                codeBox.style.display = "none";
            }

            textBox.scrollTop = textBox.scrollHeight;
        })
        .catch(error => console.error("Error:", error));
    
    return newNode
}

function loadJson() {
    fetch('/getToolList') // 向 Flask 請求
        .then(response => response.json())
        .then(data => {
            const buttonContainer = document.getElementById('grids');
            buttonContainer.innerHTML = ''; // 清空容器

            // 從 JSON 數據中創建按鈕
            data.QuarkScriptTools.forEach(tool => {
                const button = document.createElement('button');
                button.className = 'grid-button';
                button.innerText = tool.title; // 設定按鈕文字
                button.setAttribute('onclick', 'callAddNewNode(' + tool.id + ', "' + tool.title + '", "' + tool.description + '")');

                buttonContainer.appendChild(button); // 將按鈕添加到容器中
            });
        })
        .catch(error => console.error('錯誤:', error));
}

var highestZIndex = 1;

function expandCard(node) {
    
    if (node.get('size').height >= 120) {
        node.resize(300, 52)
    } else {
        if (node.get('fullText').includes('behavior')) {
            node.resize(300, 300)
        }else {
            node.resize(300, 120)
        }
    }
}

function behaviorEditSubmit(card) {
    const firstAPI = card.querySelector('input[name="firstAPI"]').value
    const secondAPI = card.querySelector('input[name="secondAPI"]').value
    console.log(firstAPI, secondAPI)
    fetch('/add_behavior', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstAPI: firstAPI,
            secondAPI: secondAPI
        })
    }).then(response => response.json())
    .then(data => {
        console.log(data)
    })
    .catch(error => console.error('error:', error));
}


// 監聽 element 上的 mousedown 事件，當使用者按住時觸發
paper.on('element:pointerdown', function (elementView, evt) {
    const clickedElement = evt.target;

    if (clickedElement.classList.contains('expand-button')) {
        expandCard(elementView.model)
    }
});
