const { Op } = require('sequelize')
const userModel = require('./model/userModel')

// 登录
module.exports.loginDao = async function (loginInfo) {
  const data = await userModel.findOne({
    where: {
      loginId: loginInfo.loginId,
      loginPwd: loginInfo.loginPwd,
    },
  })
  return data
}

// 注册 添加用户
module.exports.registDao = async function (registInfo) {
  const data = await userModel.create({
    loginId: registInfo.loginId,
    loginPwd: registInfo.loginPwd,
    name: registInfo.loginId,
    roleId: 20,
    isblock: 10,
    createDate: new Date().getTime(),
  })
  return data.dataValues
}

// 根据用户名查找数据
module.exports.getInfo = async function (id) {
  const data = await userModel.findOne({
    where: {
      loginId: id,
    },
  })
  return data
}

// 管理员：分页 + 关键字查询用户（用户名/昵称/ID）
module.exports.getUserListDao = async function ({ keyword, page, pageSize, order } = {}) {
  const where = {}
  const kw = keyword && keyword.trim()
  if (kw) {
    const like = { [Op.like]: `%${kw}%` }
    const conditions = [{ loginId: like }, { name: like }]
    const idNum = Number(kw)
    if (Number.isInteger(idNum) && idNum > 0) {
      conditions.push({ id: idNum })
    }
    where[Op.or] = conditions
  }
  const limit = Number(pageSize) > 0 ? Number(pageSize) : 10
  const offset = ((Number(page) > 0 ? Number(page) : 1) - 1) * limit
  const sortDir = order === 'asc' ? 'ASC' : 'DESC'
  const { rows, count } = await userModel.findAndCountAll({
    where,
    order: [['id', sortDir]],
    limit,
    offset,
    attributes: ['id', 'loginId', 'name', 'roleId', 'isblock'],
  })
  return { rows, count }
}

// 根据 id 查询用户
module.exports.getUserByIdDao = async function (id) {
  return await userModel.findByPk(id)
}

// 管理员：设置用户的启用/禁用状态
module.exports.updateUserBlockDao = async function (id, isblock) {
  return await userModel.update({ isblock }, { where: { id } })
}

// 更新最近登录时间
module.exports.updateLastLoginDao = async function (id) {
  return await userModel.update({ lastLoginDate: new Date().getTime() }, { where: { id } })
}

// 管理员：用户统计
module.exports.getUserStatsDao = async function () {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const ts = startOfToday.getTime()
  const [total, todayNew, todayActive] = await Promise.all([
    userModel.count(),
    userModel.count({ where: { createDate: { [Op.gte]: ts } } }),
    userModel.count({ where: { lastLoginDate: { [Op.gte]: ts } } }),
  ])
  return { total, todayNew, todayActive }
}
