const jwt = require("jsonwebtoken")
const md5 = require('md5')
// 格式化要响应的数据
module.exports.formatResponse = function(code,msg,data){
    return {
        "code": code,
        "msg": msg,
        "data": data
    }
}

// 解析token
module.exports.analysisToken = function(token){
    if(!token || typeof token !== 'string') return null
    const parts = token.split(" ")
    const jwtToken = parts[parts.length - 1]
    if(!jwtToken) return null
    const res = jwt.verify(jwtToken,md5(process.env.JWT_SECRET))
    return res;
}