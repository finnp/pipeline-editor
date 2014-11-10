var request = require('browser-request')
var totable = require('htmltable')
var saveJSON = require('./lib/downloadjson.js')
var elementClass = require('element-class')
var ssejson = require('ssejson')

var $ = document.querySelector.bind(document)
var $All = document.querySelectorAll.bind(document)

window.onload = function () {
  
  var exportButton = $('#export')
  
  // init first peek button
  var peekButton = $('.peek')
  peekButton.onclick = peekButtonEvent
  
  var runFromHereButton = $('.runfromhere')
  runFromHereButton.onclick = runFromHereButtonEvent
  
  exportButton.onclick = function () {
    var commands = getPipeline()
    saveJSON({main: commands}, 'gasket.json')
  }

  var addRowButton = $('#add')
  
  var tabindex = 1
  
  addRowButton.onclick = function () {
    var li = $('#step-template li').cloneNode(true)
    var ul = $('#commands')

    tabindex++
    li.querySelector('input').setAttribute('tabindex', tabindex)
    
    var removeButton = li.querySelector('.remove')
    removeButton.onclick = remove.bind(null, ul, li)

     li.querySelector('.peek').onclick = peekButtonEvent
     li.querySelector('.runfromhere').onclick = runFromHereButtonEvent
    

    elementClass(li).remove('hidden')
    ul.appendChild(li)
  }
  
  function getStepPosition(li) {
    var pos = -2
    while (li = li.previousSibling) ++pos
    if(pos < 0) pos = 0
    return pos
  }

  function remove(ul, li, e) {
    var pos = getStepPosition(e.target.parentNode)
    var isCurrent = elementClass(li).has('peekcurrent')
    if(isCurrent) markCurrentPeek(li.previousElementSibling)
    peekStep(pos - 1)
    hideButtonsFrom('.peek', pos)
    hideButtonsFrom('.runfromhere', pos)
    ul.removeChild(li)
  }


  function markCurrentPeek(element) {
    var lis = $All('#commands li')
    for(var i = 0; i < lis.length; i++)
      elementClass(lis[i]).remove('peekcurrent')
    elementClass(element).add('peekcurrent')
  }
  
  function peekButtonEvent(e) {
    var pos = getStepPosition(e.target.parentNode)
    
    markCurrentPeek(e.target.parentNode)
    
    peekStep(pos)
  }
  
  function runFromHereButtonEvent(e) {
    var pos = getStepPosition(e.target.parentNode)
    runFrom(pos) 
  }
  
  function peekStep(pos) {
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
    var inputs = $All('#commands li input')
    var commands = [source]
    for(var i = 1; i < inputs.length; i++)
      commands.push(inputs[i].value)
    return commands
  }
  
  
  function hideButtonsFrom(selector, i) {
    var buttons = $All(selector)
    while(i < buttons.length && i++) {
      if(buttons[i]) elementClass(buttons[i]).add('hidden')
    }
  }
  
  function showButtons(selector) {
    var peeks = $All(selector)
    for(var i = 0; i < peeks.length; i++) {
      elementClass(peeks[i]).remove('hidden')
    }
  }
  
  function evaluate() {
    showButtons('.peek')
    showButtons('.runfromhere')
    
    runFrom(-1) // 0 is first cache
    
    var lastElement = 
      $('#commands li:last-child')
      || $('.source')
    
    markCurrentPeek(lastElement)

    return false
  }
  
  function runFrom(pos) {
    var commands = getPipeline()
    var qs = '?position=' + pos + '&commands=' + encodeURIComponent(JSON.stringify(commands))
    
    ssejson.fromEventSource('/sse' + qs)
      .pipe(totable($('#result')))
  }


  evaluateButton.onclick = evaluate
}

