const svgCaptcha = require("svg-captcha")

module.exports.getCaptchService = async function(){
   return svgCaptcha.create({
        size:4,
        ignoreChars:'iILl0Oo',
        // 干扰线
        noise:6,
        color:true
    })
    
}