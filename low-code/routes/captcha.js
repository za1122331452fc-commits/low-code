var express = require('express');
var router = express.Router();
const {getCaptchService} = require('../service/captchaService')
// 获取验证码
router.get('/',async function(req, res, next) {
    // 生成验证码
    const captcha = await getCaptchService()
    // 存入session
    req.session.captcha = captcha.text
    // 设置响应头
    res.setHeader("Content-Type","image/svg+xml")
    res.send(captcha.data)
    return;
});

module.exports = router