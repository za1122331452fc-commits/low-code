const { fn, col, Op } = require('sequelize')
const quizModel = require('./model/quizModel')
const answerModel = require('./model/answerModel')

// 发布在线问卷
module.exports.createQuizDao = async function (data) {
  return await quizModel.create(data)
}

// 根据链接标识查询在线问卷
module.exports.getQuizByQuizIdDao = async function (quizId) {
  return await quizModel.findOne({ where: { quizId } })
}

// 保存一份答题记录
module.exports.createAnswerDao = async function (data) {
  return await answerModel.create(data)
}

// 我发布的问卷（按发布时间排序，可标题搜索）
module.exports.getQuizzesByCreatorDao = async function (creatorId, { keyword, order } = {}) {
  const where = { creatorId }
  if (keyword) {
    where.title = { [Op.like]: `%${keyword}%` }
  }
  const sortDir = order === 'asc' ? 'ASC' : 'DESC'
  return await quizModel.findAll({
    where,
    order: [['createDate', sortDir]],
  })
}

// 某问卷的全部答题记录（按提交时间正序）
module.exports.getAnswersByQuizIdDao = async function (quizId) {
  return await answerModel.findAll({
    where: { quizId },
    order: [['createDate', 'ASC']],
  })
}

// 批量统计各问卷的提交数，返回 { quizId: count }
module.exports.countAnswersByQuizIdsDao = async function (quizIds) {
  if (!quizIds.length) return {}
  const rows = await answerModel.findAll({
    attributes: ['quizId', [fn('COUNT', col('id')), 'count']],
    where: { quizId: quizIds },
    group: ['quizId'],
    raw: true,
  })
  const map = {}
  rows.forEach((r) => {
    map[r.quizId] = Number(r.count)
  })
  return map
}
