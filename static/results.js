function openGoogleTranslate(e) {
  if (e.button || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
  window.open(e.target.href, 'googletranslate', 'height=500,width=500').focus();
  e.preventDefault();
}

function annotationFocus(el) {
  el.checked = true;
  el.parentNode.scrollIntoView({block: 'nearest', inline: 'nearest'});
}