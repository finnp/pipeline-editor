module.exports = function download(json, filename) {
  var text = JSON.stringify(json, null, ' ')
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);
  pom.click();
}
