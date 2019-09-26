var pending;

var sel = {
  file: 'input[name=image]',
  fileB64: 'input[name=imageB64]',
  fileB64Name: '.imageB64Name',
  preview: '.imagepreview',
  previewImg: '.imagepreview > img',
  previewName: '.imagepreview-filename',
  submit: 'input[type=submit]'
};

function $(selector) {
  return document.querySelector(selector);
}

function showPreview(file, name) {
  var url = (typeof file === 'object') ? URL.createObjectURL(file) : file;
  $(sel.previewImg).src = url;
  $(sel.previewName).textContent = (name || file.name);
  $(sel.file).hidden = true;
  $(sel.preview).hidden = false;
}

function fileInputChanged(el) {
  $(sel.fileB64).value = '';
  showPreview(el.files[0]);
}

function replaceFileInput() {
  var input = $(sel.file);
  var template = document.createElement('span');
  template.innerHTML = input.outerHTML;
  var input2 = template.firstChild;
  input.parentNode.replaceChild(input2, input);
  return input2;
}

function clearFile() {
  var input2 = replaceFileInput();
  $(sel.fileB64).value = '';
  $(sel.preview).hidden = true;
  input2.hidden = false;
}

function setFile(file) {
  var reader = new FileReader();
  reader.onload = function() {
    replaceFileInput();
    $(sel.fileB64).value = reader.result;
    $(sel.fileB64Name).value = file.name;
    showPreview(file);
  };
  reader.readAsDataURL(file);
}

document.ondragover = function(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
};

document.ondrop = function(e) {
  if (e.target.nodeName === 'INPUT') return;
  var file = e.dataTransfer.files[0];
  if (!file) return;
  e.preventDefault();
  setFile(file);
};

document.addEventListener('DOMContentLoaded', function() {
  var file;
  if ((file = $(sel.file).files[0])) {
    showPreview(file);
  } else if ((file = $(sel.fileB64).value)) {
    var name = $(sel.fileB64Name).value
    showPreview(file, name);
  }
});
