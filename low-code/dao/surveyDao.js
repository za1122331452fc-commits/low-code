const { Op } = require('sequelize')
const surveyModel = require('./model/surveyModel')
const userModel = require('./model/userModel')

// 列表查询只需列表展示字段，排除体积大的 coms（详情走 getSurveyByIdDao 单独取）
const LIST_ATTRIBUTES = [
  'id',
  'userId',
  'title',
  'createDate',
  'updateDate',
  'surveyCount',
  'isblock',
]

// 新增问卷
module.exports.saveSurveyDao = async function (data) {
  return await surveyModel.create(data)
}

// 分页 + 标题模糊搜索查询当前用户的问卷（按更新时间排序）
module.exports.getSurveysDao = async function (userId, { keyword, page, pageSize, order } = {}) {
  const where = { userId }
  if (keyword) {
    where.title = { [Op.like]: `%${keyword}%` }
  }
  const limit = Number(pageSize) > 0 ? Number(pageSize) : 10
  const offset = ((Number(page) > 0 ? Number(page) : 1) - 1) * limit
  const sortDir = order === 'asc' ? 'ASC' : 'DESC'
  const { rows, count } = await surveyModel.findAndCountAll({
    where,
    attributes: LIST_ATTRIBUTES,
    order: [['updateDate', sortDir]],
    limit,
    offset,
  })
  return { rows, count }
}

// 根据 id + userId 查询单个问卷
module.exports.getSurveyByIdDao = async function (id, userId) {
  return await surveyModel.findOne({ where: { id, userId } })
}

// 根据 id 查询单个问卷
module.exports.getSurveyByIdPlainDao = async function (id) {
  return await surveyModel.findByPk(id)
}

// 更新问卷
module.exports.updateSurveyDao = async function (id, userId, data) {
  return await surveyModel.update(data, { where: { id, userId } })
}

// 更新问卷
module.exports.updateSurveyByIdDao = async function (id, data) {
  return await surveyModel.update(data, { where: { id } })
}

// 删除问卷
module.exports.deleteSurveyDao = async function (id, userId) {
  return await surveyModel.destroy({ where: { id, userId } })
}

// 管理员
module.exports.updateSurveyBlockDao = async function (id, isblock) {
  return await surveyModel.update({ isblock }, { where: { id } })
}

// 管理员
module.exports.getAdminSurveysDao = async function ({ keyword, page, pageSize, order } = {}) {
  const where = {}
  const kw = keyword && keyword.trim()
  if (kw) {
    const like = { [Op.like]: `%${kw}%` }
    const conditions = [{ title: like }]
    // 按所有者用户名/昵称搜索
    const users = await userModel.findAll({
      where: { [Op.or]: [{ loginId: like }, { name: like }] },
      attributes: ['id'],
    })
    if (users.length) {
      conditions.push({ userId: users.map((u) => u.id) })
    }
    where[Op.or] = conditions
  }

  const limit = Number(pageSize) > 0 ? Number(pageSize) : 10
  const offset = ((Number(page) > 0 ? Number(page) : 1) - 1) * limit
  const sortDir = order === 'asc' ? 'ASC' : 'DESC'
  const { rows, count } = await surveyModel.findAndCountAll({
    where,
    attributes: LIST_ATTRIBUTES,
    order: [['updateDate', sortDir]],
    limit,
    offset,
  })

  // 补全所有者信息
  const userIds = [...new Set(rows.map((r) => r.dataValues.userId))]
  let userMap = {}
  if (userIds.length) {
    const users = await userModel.findAll({
      where: { id: userIds },
      attributes: ['id', 'loginId', 'name'],
    })
    userMap = {}
    users.forEach((u) => {
      userMap[u.dataValues.id] = u.dataValues
    })
  }

  return {
    rows: rows.map((r) => {
      const owner = userMap[r.dataValues.userId] || {}
      return {
        ...r.dataValues,
        loginId: owner.loginId,
        name: owner.name,
      }
    }),
    count,
  }
}
