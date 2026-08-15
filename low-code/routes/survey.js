var express = require('express')
var router = express.Router()
const { formatResponse } = require('../utils/tool')
const {
  saveSurveyService,
  getSurveysService,
  getSurveyByIdService,
  updateSurveyService,
  deleteSurveyService,
  setSurveyBlockService,
  getAdminSurveysService,
} = require('../service/surveyService')
const { ValidationError, ForbiddenError, NotFoundError } = require('../utils/error')

// 从 express-jwt 解出的载荷中获取当前用户 id
function getUserId(req) {
  if (req.auth && req.auth.id) {
    return req.auth.id
  }
  throw new ForbiddenError('未登录或登录过期')
}

// 管理员校验：JWT 载荷中的 roleId 必须为 10
function requireAdmin(req) {
  if (!req.auth || Number(req.auth.roleId) !== 10) {
    throw new ForbiddenError('无管理员权限')
  }
}

// 保存问卷
router.post('/', async function (req, res, next) {
  try {
    const userId = getUserId(req)
    const data = req.body
    if (!data.title) {
      throw new ValidationError('问卷标题不能为空')
    }
    const result = await saveSurveyService(userId, data)
    res.send(formatResponse(200, '保存成功', result))
  } catch (error) {
    next(error)
  }
})

// 查询当前用户的所有问卷（支持 keyword 标题搜索 + page/pageSize 分页 + order 排序）
// 未登录时返回空列表，方便匿名浏览平台
router.get('/', async function (req, res, next) {
  try {
    if (!req.auth) {
      res.send(formatResponse(200, '', { total: 0, list: [] }))
      return
    }
    const userId = req.auth.id
    const { keyword, page, pageSize, order } = req.query
    const data = await getSurveysService(userId, { keyword, page, pageSize, order })
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 管理员：所有用户的问卷列表（分页 + 搜索 + 排序）
router.get('/admin/list', async function (req, res, next) {
  try {
    requireAdmin(req)
    const { keyword, page, pageSize, order } = req.query
    const data = await getAdminSurveysService({ keyword, page, pageSize, order })
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 管理员：禁用/启用问卷
router.put('/admin/block/:id', async function (req, res, next) {
  try {
    requireAdmin(req)
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('无效的问卷 ID')
    }
    const { isblock } = req.body
    if (typeof isblock !== 'boolean') {
      throw new ValidationError('isblock 必须是布尔值')
    }
    const result = await setSurveyBlockService(id, isblock)
    if (!result) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '操作成功', null))
  } catch (error) {
    next(error)
  }
})

// 查询单个问卷（管理员可查看任意用户；未登录可公开查看，但被禁用的问卷不允许匿名查看）
router.get('/:id', async function (req, res, next) {
  try {
    const userId = req.auth ? req.auth.id : null
    const isAdmin = req.auth ? Number(req.auth.roleId) === 10 : false
    const data = await getSurveyByIdService(req.params.id, userId, isAdmin)
    if (!data) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 更新问卷（仅限本人，管理员不可修改他人问卷）
router.put('/:id', async function (req, res, next) {
  try {
    const userId = getUserId(req)
    const result = await updateSurveyService(req.params.id, userId, req.body)
    if (!result) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '更新成功', null))
  } catch (error) {
    next(error)
  }
})

// 删除问卷
router.delete('/:id', async function (req, res, next) {
  try {
    const userId = getUserId(req)
    const result = await deleteSurveyService(req.params.id, userId)
    if (!result) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '删除成功', null))
  } catch (error) {
    next(error)
  }
})

module.exports = router
