var express = require('express')
var router = express.Router()
const { formatResponse } = require('../utils/tool')
const { allow } = require('../utils/rateLimit')
const {
  publishQuizService,
  getQuizService,
  submitAnswerService,
  getMyQuizzesService,
  getQuizStatsService,
  getQuizAnswersService,
} = require('../service/quizService')
const { ValidationError, ForbiddenError, NotFoundError } = require('../utils/error')

// 从 express-jwt 解出的载荷中获取当前用户 id
function getUserId(req) {
  if (req.auth && req.auth.id) {
    return req.auth.id
  }
  throw new ForbiddenError('未登录或登录过期')
}

// 获取客户端 IP（优先取 X-Forwarded-For 第一段，其次 req.ip）
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (xff) {
    const first = String(xff).split(',')[0].trim()
    if (first) return first
  }
  return req.ip || req.socket.remoteAddress || ''
}

// 发布在线问卷（需登录）
router.post('/', async function (req, res, next) {
  try {
    const userId = getUserId(req)
    const data = req.body
    if (!data || !Array.isArray(data.coms) || !data.coms.length) {
      throw new ValidationError('问卷内容不能为空')
    }
    const result = await publishQuizService(userId, data)
    res.send(formatResponse(200, '发布成功', result))
  } catch (error) {
    next(error)
  }
})

// 我发布的问卷列表（需登录，分页 + 标题搜索 + 排序）
router.get('/mine', async function (req, res, next) {
  try {
    const userId = getUserId(req)
    const { keyword, page, pageSize, order } = req.query
    const data = await getMyQuizzesService(userId, { keyword, page, pageSize, order })
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 获取在线问卷（公开，无需登录）
router.get('/:quizId', async function (req, res, next) {
  try {
    const data = await getQuizService(req.params.quizId)
    if (!data) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 问卷统计（需登录 + 归属校验）
router.get('/:quizId/stats', async function (req, res, next) {
  try {
    const data = await getQuizStatsService(req.params.quizId, req.auth)
    if (!data) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 某道题的答题明细（需登录 + 归属校验）
router.get('/:quizId/answers', async function (req, res, next) {
  try {
    const { qIndex, page, pageSize } = req.query
    const data = await getQuizAnswersService(
      req.params.quizId,
      req.auth,
      qIndex,
      page,
      pageSize
    )
    if (!data) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '', data))
  } catch (error) {
    next(error)
  }
})

// 提交答案（公开，无需登录；同一 IP 5 分钟内限一次）
router.post('/:quizId/submit', async function (req, res, next) {
  try {
    const ip = getClientIp(req)
    if (!allow(`${req.params.quizId}:${ip}`)) {
      throw new ValidationError('提交过于频繁，请稍后再试')
    }
    const result = await submitAnswerService(req.params.quizId, req.body.answers, ip)
    if (!result) {
      throw new NotFoundError()
    }
    res.send(formatResponse(200, '提交成功', null))
  } catch (error) {
    next(error)
  }
})

module.exports = router
