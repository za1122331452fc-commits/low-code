// 在线问卷模块的业务逻辑
const crypto = require('crypto')
const {
  createQuizDao,
  getQuizByQuizIdDao,
  createAnswerDao,
  getQuizzesByCreatorDao,
  getAnswersByQuizIdDao,
  countAnswersByQuizIdsDao,
} = require('../dao/quizDao')
const { getSurveyByIdPlainDao } = require('../dao/surveyDao')
const { ForbiddenError, ValidationError } = require('../utils/error')

// 判断问卷是否被禁用（兼容布尔与历史 1/0 值）
function isSurveyBlocked(survey) {
  return !!(survey && (survey.dataValues.isblock === true || survey.dataValues.isblock === 1))
}

// 发布在线问卷（返回链接标识等公开信息）
module.exports.publishQuizService = async function (userId, data) {
  const quiz = {
    quizId: crypto.randomUUID(),
    title: data.title || '未命名问卷',
    creatorId: userId,
    coms: JSON.stringify(data.coms || []),
    surveyCount: data.surveyCount || 0,
    createDate: new Date().getTime(),
  }
  // 关联来源问卷；问卷被禁用时不允许发布
  if (data.surveyId) {
    const survey = await getSurveyByIdPlainDao(Number(data.surveyId))
    if (!survey) {
      throw new ValidationError('问卷不存在')
    }
    if (isSurveyBlocked(survey)) {
      throw new ValidationError('该问卷已被禁用，无法发布')
    }
    quiz.surveyId = Number(data.surveyId)
  }
  const result = await createQuizDao(quiz)
  const d = result.dataValues
  return {
    id: Number(d.id),
    quizId: d.quizId,
    title: d.title,
    surveyCount: Number(d.surveyCount),
    createDate: Number(d.createDate),
  }
}

// 获取在线问卷（公开访问）
module.exports.getQuizService = async function (quizId) {
  const quiz = await getQuizByQuizIdDao(quizId)
  if (!quiz) return null
  const d = quiz.dataValues
  let coms = []
  try {
    coms = JSON.parse(d.coms || '[]')
  } catch (e) {
    coms = []
  }
  // 来源问卷被禁用时，在线问卷标记为停用
  let disabled = false
  if (d.surveyId) {
    const survey = await getSurveyByIdPlainDao(d.surveyId)
    disabled = isSurveyBlocked(survey)
  }
  return {
    id: Number(d.id),
    quizId: d.quizId,
    title: d.title,
    surveyCount: Number(d.surveyCount),
    createDate: Number(d.createDate),
    disabled,
    coms,
  }
}

// 提交答案（公开访问）
module.exports.submitAnswerService = async function (quizId, answers, ip) {
  const quiz = await getQuizByQuizIdDao(quizId)
  if (!quiz) return false
  // 文本答案长度校验（与前端 200 字限制保持一致）
  for (const key of Object.keys(answers || {})) {
    const val = answers[key]
    if (typeof val === 'string' && val.length > 200) {
      throw new ValidationError('文本答案不能超过200字')
    }
  }
  // 来源问卷被禁用时禁止继续作答
  if (quiz.dataValues.surveyId) {
    const survey = await getSurveyByIdPlainDao(quiz.dataValues.surveyId)
    if (isSurveyBlocked(survey)) {
      throw new ValidationError('该问卷已停用，无法提交')
    }
  }
  await createAnswerDao({
    quizId,
    answers: JSON.stringify(answers || {}),
    ip: ip || null,
    createDate: new Date().getTime(),
  })
  return true
}

// ============ 发布者查看答题情况 ============

// 校验当前用户是否有权查看该问卷（发布者本人或管理员）
function ensureCanView(quiz, auth) {
  const d = quiz.dataValues
  const isAdmin = Number(auth.roleId) === 10
  if (!isAdmin && Number(d.creatorId) !== Number(auth.id)) {
    throw new ForbiddenError('无权查看该问卷')
  }
}

// 我发布的问卷列表（含提交数，分页 + 标题搜索 + 排序）
module.exports.getMyQuizzesService = async function (creatorId, { keyword, page, pageSize, order } = {}) {
  const quizzes = await getQuizzesByCreatorDao(creatorId, { keyword, order })
  const quizIds = quizzes.map((q) => q.dataValues.quizId)
  const countMap = await countAnswersByQuizIdsDao(quizIds)
  const list = quizzes.map((q) => {
    const d = q.dataValues
    return {
      id: Number(d.id),
      quizId: d.quizId,
      title: d.title,
      surveyCount: Number(d.surveyCount),
      createDate: Number(d.createDate),
      answerCount: countMap[d.quizId] || 0,
    }
  })

  const limit = Number(pageSize) > 0 ? Number(pageSize) : 10
  const offset = ((Number(page) > 0 ? Number(page) : 1) - 1) * limit
  return {
    total: list.length,
    list: list.slice(offset, offset + limit),
  }
}

// 解析一份问卷的组件数组
function parseComs(quiz) {
  const d = quiz.dataValues
  let coms = []
  try {
    coms = JSON.parse(d.coms || '[]')
  } catch (e) {
    coms = []
  }
  return coms
}

// 判断题是否为备注说明（不计入题号）
function isNoteCom(com) {
  return !com || !com.name || com.name === 'text-note'
}

// 计算第 qIndex 个组件对应的题号（与前端 useSurveyNo 一致，备注不计号）
function getQuestionNumberAt(coms, qIndex) {
  let num = 0
  for (let i = 0; i <= qIndex; i++) {
    if (!isNoteCom(coms[i])) num++
  }
  return num
}

// 问卷统计
module.exports.getQuizStatsService = async function (quizId, auth) {
  const quiz = await getQuizByQuizIdDao(quizId)
  if (!quiz) return null
  ensureCanView(quiz, auth)

  const coms = parseComs(quiz)
  const answers = await getAnswersByQuizIdDao(quizId)

  // 解析每份提交：{ 题号: 答案 }
  const records = answers.map((a) => {
    let ans = {}
    try {
      ans = JSON.parse(a.dataValues.answers || '{}')
    } catch (e) {
      ans = {}
    }
    return ans
  })

  let questionNumber = 0
  const questions = coms.map((com, index) => {
    const status = (com && com.status) || {}
    const base = { index, name: com.name, title: (status.title && status.title.status) || '' }

    if (isNoteCom(com)) {
      // 备注说明分「标题」「段落」两种形态：标题用 title，段落用 desc
      const noteType = (status.type && status.type.currentStatus) ?? 1
      const noteContent =
        noteType === 0
          ? (status.title && status.title.status) || ''
          : (status.desc && status.desc.status) || ''
      return { ...base, type: 'note', title: noteContent }
    }

    questionNumber++
    const serial = questionNumber

    // 选择题：统计各选项人数
    if (status.options) {
      const optionsArr = status.options.status
      // 图片题选项为对象 { picTitle, picDesc, value }，文本题选项为字符串
      const labels = []
      const images = []
      const descs = []
      if (Array.isArray(optionsArr)) {
        for (const o of optionsArr) {
          if (typeof o === 'string') {
            labels.push(o)
            images.push('')
            descs.push('')
          } else if (o && typeof o === 'object') {
            labels.push((o && o.picTitle) || '')
            images.push((o && o.value) || '')
            descs.push((o && o.picDesc) || '')
          }
        }
      }
      const counts = new Array(labels.length).fill(0)
      let answered = 0
      // 打分题：答案是 1~5 的数字，对应选项下标 value-1；其他选择题答案为选项字符串/数组
      const isRate = com.name === 'rate-score'
      for (const rec of records) {
        const val = rec[serial]
        if (val === undefined || val === null || val === '') continue
        answered++
        if (isRate) {
          const idx = Math.round(Number(val)) - 1
          if (idx >= 0 && idx < labels.length) counts[idx]++
        } else {
          const selected = Array.isArray(val) ? val : [val]
          for (const s of selected) {
            const idx = labels.indexOf(s)
            if (idx >= 0) counts[idx]++
          }
        }
      }
      const options = labels.map((label, i) => ({
        label,
        image: images[i] || '',
        desc: descs[i] || '',
        count: counts[i],
        percent: answered ? Math.round((counts[i] / answered) * 1000) / 10 : 0,
      }))
      return { ...base, type: 'choice', answered, options }
    }

    // 文本题：只统计有效作答份数
    let answered = 0
    for (const rec of records) {
      const val = rec[serial]
      if (val !== undefined && val !== null && String(val).trim() !== '') answered++
    }
    return { ...base, type: 'text', answered }
  })

  return {
    quizId,
    title: quiz.dataValues.title,
    total: answers.length,
    questions,
  }
}

// 某道题（文本）的答题明细，分页
module.exports.getQuizAnswersService = async function (quizId, auth, qIndex, page, pageSize) {
  const quiz = await getQuizByQuizIdDao(quizId)
  if (!quiz) return null
  ensureCanView(quiz, auth)

  const coms = parseComs(quiz)
  const idx = Number(qIndex)
  if (!Number.isInteger(idx) || idx < 0 || idx >= coms.length) return null
  const com = coms[idx]
  const status = (com && com.status) || {}
  // 备注说明分「标题」「段落」两种形态：标题用 title，段落用 desc
  let title = (status.title && status.title.status) || ''
  if (isNoteCom(com)) {
    const noteType = (status.type && status.type.currentStatus) ?? 1
    title =
      noteType === 0
        ? (status.title && status.title.status) || ''
        : (status.desc && status.desc.status) || ''
  }

  const serial = getQuestionNumberAt(coms, idx)
  const answers = await getAnswersByQuizIdDao(quizId)

  // 收集本题的有效回答
  const all = []
  for (const a of answers) {
    let ans = {}
    try {
      ans = JSON.parse(a.dataValues.answers || '{}')
    } catch (e) {
      ans = {}
    }
    const val = ans[serial]
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      all.push({ answer: String(val), time: Number(a.dataValues.createDate) })
    }
  }

  const limit = Number(pageSize) > 0 ? Number(pageSize) : 10
  const offset = ((Number(page) > 0 ? Number(page) : 1) - 1) * limit

  // 时间题：解析 el-date-picker 的子类型（week/year/month/date），供前端按类型格式化答案
  let answerType = ''
  if (com && com.name === 'date-time' && status.type) {
    const opts = status.type.status
    const cur = status.type.currentStatus
    answerType = (Array.isArray(opts) && opts[cur] && opts[cur].value) || 'date'
  }

  return {
    title,
    name: (com && com.name) || '',
    type: answerType,
    total: all.length,
    list: all.slice(offset, offset + limit),
  }
}
