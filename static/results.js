function openTranslate(e) {
  if (e.button || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
  window.open(e.target.href, 'translate', 'height=500,width=800').focus();
  e.preventDefault();
}

function annotationFocus(el) {
  el.checked = true;
  el.parentNode.scrollIntoView({block: 'nearest', inline: 'nearest'});
}

function handleSelection(el) {
  var sel = document.getSelection();
  if (!sel.isCollapsed && el.contains(sel.focusNode)) {
    el.querySelector('input').checked = true;
  }
}

function initHistory() {
  var container = document.querySelector('.image-container');
  if (history.state) {
    container.innerHTML = history.state.imageHTML;
  } else {
    history.replaceState({imageHTML: container.innerHTML}, '', location.href);
  }
}

document.addEventListener('DOMContentLoaded', initHistory);
