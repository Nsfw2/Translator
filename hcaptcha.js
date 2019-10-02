const fs = require('fs');
const {URLSearchParams} = require('url');
const fetch = require('node-fetch');
const html = require('./html');

const {sitekey, secret} = JSON.parse(fs.readFileSync('../keys/hcaptcha.json', {encoding: 'utf-8'}));

const templates = html.makeTemplates({
  hcaptcha: `
    <div class="h-captcha" data-sitekey="<%- sitekey %>" data-callback="onCaptchaSolved"></div>
    <script src="https://hcaptcha.com/1/api.js" async defer></script>
  `
});

function widget() {
  return templates.hcaptcha({sitekey});
}

async function verify(token) {
  try {
    if (typeof token !== 'string') {
      console.error('hCaptcha token = ', token);
      return false;
    }
    const params = new URLSearchParams([['secret', secret], ['response', token]]);
    const response = await fetch('https://hcaptcha.com/siteverify', {method: 'POST', body: params});
    const json = await response.json();
    return !!json.success;
  } catch(err) {
    console.error(err);
    return false;
  }
}

module.exports = {widget, verify};
