var request = require('browser-request')
var totable = require('htmltable')
var saveJSON = require('./lib/downloadjson.js')
var elementClass = require('element-class')
var ssejson = require('ssejson')

var $ = document.querySelector.bind(document)
var $All = document.querySelectorAll.bind(document)

window.onload = function () {
  
  var exportButton = $('#export')
  
  exportButton.onclick = function () {
    var commands = getPipeline()
    saveJSON({main: commands}, 'gasket.json')
  }

  var addRowButton = $('#add')
  
  addRowButton.onclick = function () {
    var li = $('#commands li.hidden').cloneNode(true)
    var ul = $('#commands')
    
    var removeButton = li.querySelector('.remove')
    removeButton.onclick = remove.bind(null, ul, li)
    
    var peekButton = li.querySelector('.peek')
    peekButton.onclick = peek
    
    li.className = '' // remove hidden
    ul.appendChild(li)
  }
  
  function positionFromButton(button) {
    var pos = -2 // offset
    var li = button.parentNode
    while (li = li.previousSibling) ++pos
    return pos
  }

  function remove(ul, li, e) {
    var pos = positionFromButton(e.target)
    hidePeekButtonsFrom(pos)
    ul.removeChild(li)
  }

  
  function peek(e) {
    var pos = positionFromButton(e.target)
    
    ssejson.fromEventSource('/sse?peek=' + pos)
      .pipe(totable($('#result')))
  }
  
  var evaluateButton = $('#evaluate')
  
  
  function getSourceCmd(source, sourcetype) {
    // TODO: This should be npm command line tools
    if(sourcetype === 'get')
      return 'curl ' + source
    
    if(sourcetype === 'file')
      return 'cat ' + source
    
    return source
  }
  
  function getPipeline() {
    var source = getSourceCmd(
      $('#source').value, 
      $('#sourcetype').value
    )
    var inputs = $All('#commands li:not(.hidden) input')
    var commands = [source]
    for(var i = 0; i < inputs.length; i++)
      commands.push(inputs[i].value)
    return commands
  }
  
  
  function hidePeekButtonsFrom(i) {
    var peeks = $All('.peek')
    while(i < peeks.length && i++) {
      if(peeks[i]) elementClass(peeks[i]).add('hidden')
    }
  }
  
  function showPeekButtons() {
    // make peek button visible
    var peeks = $All('.peek')
    for(var i = 0; i < peeks.length; i++) {
      elementClass(peeks[i]).remove('hidden')
    }
  }
  
  function evaluate() {
    var commands = getPipeline()
      
    var qs = '?commands=' + encodeURIComponent(JSON.stringify(commands))
    
    showPeekButtons()

    ssejson.fromEventSource('/sse' + qs)
      .pipe(totable($('#result')))

    return false
  }


  evaluateButton.onclick = evaluate
}

