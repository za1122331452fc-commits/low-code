var express = require('express');
var router = express.Router();
const {formatResponse,analysisToken} = require('../utils/tool')
const {loginService,registService,getUsersService,setUserBlockService,getUserStatsService} = require('../service/userService');
const { ValidationError, ForbiddenError, UnknownError, NotFoundError } = require('../utils/error');

// 管理员校验：JWT 载荷中的 roleId 必须为 10
function requireAdmin(req) {
  if (!req.auth || Number(req.auth.roleId) !== 10) {
    throw new ForbiddenError('无管理员权限')
  }
}

// 管理员：用户统计（总用户 / 今日新增 / 今日活跃，需 JWT 且为管理员）
router.get('/admin/stats', async function (req, res, next) {
  try {
    requireAdmin(req)
    const data = await getUserStatsService()
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 管理员：用户列表（分页 + 关键字搜索 + 排序，需 JWT 且为管理员）
router.get('/admin/users', async function (req, res, next) {
  try {
    requireAdmin(req)
    const { keyword, page, pageSize, order } = req.query
    const data = await getUsersService({ keyword, page, pageSize, order })
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 管理员：启用/禁用用户（需 JWT 且为管理员）
router.put('/admin/block/:id', async function (req, res, next) {
  try {
    requireAdmin(req)
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('无效的用户 ID')
    }
    if (id === req.auth.id) {
      throw new ForbiddenError('不能操作自己的账号')
    }
    const { isblock } = req.body
    const result = await setUserBlockService(id, isblock)
    if (!result) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '操作成功', null))
  } catch (error) {
    next(error)
  }
})


// 登录
router.post('/login', async function(req, res, next) {
  try {
    const { loginId, loginPwd, captcha } = req.body
    // 1. 验证码校验
    if (!captcha) {
      throw new ValidationError('验证码不能为空!')
    }
    if (!req.session.captcha) {
      throw new ValidationError('验证码已过期，请重新获取')
    }
    if (captcha.toLowerCase() !== req.session.captcha.toLowerCase()) {
      throw new ValidationError('验证码错误')
    }
    // 2. 验证通过，清除验证码
    delete req.session.captcha
    // 3. 登录
    const result = await loginService({ loginId, loginPwd })
    if (result && result.token) {
      res.setHeader('authorization', result.token)
      res.send(formatResponse(200, '登录成功', result.data))
      return;
    } else if(result === 20) {
       throw new ValidationError('您已被管理员禁用!')
    }else{
      throw new ValidationError('用户名或密码错误!')
    }

  } catch (error) {
    next(error)
  }
})

// 注册
router.post('/regist',async function (req, res, next) {
  // 用户名或密码是否为空
  try {
      const info = req.body
    if(!info.loginId || !info.loginPwd){
      throw new ValidationError('用户名或密码不能为空!')
    }
    if(info.loginId.length < 5 || info.loginPwd.length < 6){
      throw new ValidationError('用户名长度不能小于5,密码长度不能小于6!')
    }
    const data = await registService(req.body)
    if(data){
      // 设置头部token
      res.setHeader('authorization', data.token)
      res.send(formatResponse(200,'注册成功!',{
      "id":data.id,
      "loginId":data.loginId,
      "name":data.name,
      "roleId":data.roleId
    }))
    }else{
      throw new ValidationError('用户名不可重复!')
    }
  } catch (error) {
     next(error)
  }
  
  
})

// 恢复登录状态
router.get('/whoami', async function(req, res, next) {
  try {
    // 获取token  
    const token = await req.get('authorization')
    // 解析token 还原成用户信息
    const info = analysisToken(token)
    if(!info){
      // token 无效或过期，交给错误中间件返回 401
      throw new ForbiddenError('未登录或登录过期')
    }
    // 返回客户端
    res.send(formatResponse(200,'',{
      "id":info.id,
      "loginId":info.loginId,
      "name":info.name,
      "roleId":info.roleId
    }))
  } catch (error) {
    // 区分 token 类错误与业务错误
    if (error instanceof ForbiddenError) {
      res.send(error.toResponseJSON())
      return
    }
    if (error && (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError')) {
      res.send(new ForbiddenError('未登录或登录过期').toResponseJSON())
      return
    }
    next(error)
  }
});

module.exports = router;
