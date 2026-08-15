const {
  saveSurveyDao,
  getSurveysDao,
  getSurveyByIdDao,
  getSurveyByIdPlainDao,
  updateSurveyDao,
  updateSurveyByIdDao,
  deleteSurveyDao,
  updateSurveyBlockDao,
  getAdminSurveysDao,
} = require('../dao/surveyDao')

// 将数据库行格式化为前端需要的结构（解析 coms JSON、bigint 转 number）
function formatSurvey(row) {
  const data = row.dataValues || row
  let coms = []
  if (data.coms) {
    try {
      coms = JSON.parse(data.coms)
    } catch (e) {
      coms = []
    }
  }
  return {
    id: Number(data.id),
    userId: Number(data.userId),
    title: data.title,
    createDate: Number(data.createDate),
    updateDate: Number(data.updateDate),
    surveyCount: Number(data.surveyCount),
    isblock: data.isblock === true || data.isblock === 1,
    coms,
  }
}

// 保存问卷
module.exports.saveSurveyService = async function (userId, data) {
  const now = new Date().getTime()
  const survey = {
    userId,
    title: data.title || '未命名问卷',
    createDate: data.createDate || now,
    updateDate: data.updateDate || now,
    surveyCount: data.surveyCount || 0,
    coms: JSON.stringify(data.coms || []),
  }
  const result = await saveSurveyDao(survey)
  return formatSurvey(result)
}

// 查询当前用户的所有问卷（分页 + 标题搜索，返回 { list, total }）
module.exports.getSurveysService = async function (userId, { keyword, page, pageSize, order } = {}) {
  const { rows, count } = await getSurveysDao(userId, { keyword, page, pageSize, order })
  return {
    total: count,
    list: rows.map((item) => formatSurvey(item)),
  }
}

// 查询单个问卷（isAdmin 时管理员可查看任意用户的问卷；userId 为空时为匿名公开查看，被禁用的不允许查看）
module.exports.getSurveyByIdService = async function (id, userId, isAdmin) {
  let survey
  if (isAdmin) {
    survey = await getSurveyByIdPlainDao(id)
  } else if (userId) {
    survey = await getSurveyByIdDao(id, userId)
  } else {
    // 匿名公开查看：按 id 查，被禁用的问卷不开放
    survey = await getSurveyByIdPlainDao(id)
    if (survey && (survey.dataValues.isblock === true || survey.dataValues.isblock === 1)) {
      return null
    }
  }
  if (!survey) return null
  return formatSurvey(survey)
}

// 更新问卷（仅限本人；管理员只能查看，不能修改他人问卷）
module.exports.updateSurveyService = async function (id, userId, data) {
  const survey = await getSurveyByIdDao(id, userId)
  if (!survey) return false
  const raw = survey.dataValues
  const updateData = {
    title: data.title !== undefined ? data.title : raw.title,
    surveyCount: data.surveyCount !== undefined ? data.surveyCount : raw.surveyCount,
    coms: data.coms !== undefined ? JSON.stringify(data.coms) : raw.coms,
    updateDate: new Date().getTime(),
  }
  await updateSurveyDao(id, userId, updateData)
  return true
}

// 删除问卷（仅限本人）
module.exports.deleteSurveyService = async function (id, userId) {
  const survey = await getSurveyByIdDao(id, userId)
  if (!survey) return false
  await deleteSurveyDao(id, userId)
  return true
}

// 管理员：禁用/启用问卷
module.exports.setSurveyBlockService = async function (id, isblock) {
  const survey = await getSurveyByIdPlainDao(id)
  if (!survey) return false
  await updateSurveyBlockDao(id, isblock)
  return true
}

// 管理员：所有用户的问卷列表（分页 + 搜索，带所有者信息）
module.exports.getAdminSurveysService = async function ({ keyword, page, pageSize, order } = {}) {
  const { rows, count } = await getAdminSurveysDao({ keyword, page, pageSize, order })
  return {
    total: count,
    list: rows.map((row) => ({
      id: Number(row.id),
      userId: Number(row.userId),
      title: row.title,
      createDate: Number(row.createDate),
      updateDate: Number(row.updateDate),
      surveyCount: Number(row.surveyCount),
      isblock: row.isblock === true || row.isblock === 1,
      ownerLoginId: row.loginId || '',
      ownerName: row.name || '',
    })),
  }
}
