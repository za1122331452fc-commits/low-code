// 用户模块的业务逻辑
const md5 = require('md5')
const { loginDao, registDao, getInfo, getUserListDao, getUserByIdDao, updateUserBlockDao, updateLastLoginDao, getUserStatsDao } = require('../dao/userDao')
const { ForbiddenError } = require('../utils/error')
const jwt = require('jsonwebtoken')

// 管理员：查询用户列表（分页 + 关键字搜索 + 排序）
module.exports.getUsersService = async function ({ keyword, page, pageSize, order } = {}) {
  const { rows, count } = await getUserListDao({ keyword, page, pageSize, order })
  return {
    total: count,
    list: rows.map((item) => {
      const d = item.dataValues
      // isblock 约定：10 正常 / 20 禁用；兼容历史脏数据（true/1 也视为禁用）
      const isblock = Number(d.isblock)
      return {
        id: Number(d.id),
        loginId: d.loginId,
        name: d.name,
        roleId: Number(d.roleId),
        isblock: isblock === 20 || isblock === 1 ? 20 : 10,
      }
    }),
  }
}

// 管理员：启用/禁用用户（不允许操作管理员账号）
module.exports.setUserBlockService = async function (id, isblock) {
  const user = await getUserByIdDao(id)
  if (!user) return false
  if (user.dataValues.roleId === 10) {
    throw new ForbiddenError('不能操作管理员账号')
  }
  // 归一化存储：任意真值（true/1/20）→ 20 禁用，其余 → 10 正常
  const blocked = isblock === true || Number(isblock) === 1 || Number(isblock) === 20
  await updateUserBlockDao(id, blocked ? 20 : 10)
  return true
}

// 管理员：用户统计（总用户 / 今日新增 / 今日活跃）
module.exports.getUserStatsService = async function () {
  return await getUserStatsDao()
}

// 登录
module.exports.loginService = async function(loginInfo){
    loginInfo.loginPwd = md5(loginInfo.loginPwd)
    let data = await loginDao(loginInfo)
    if(data && data.dataValues){
        // 被禁用的用户不允许登录（10 正常 / 20 禁用；兼容历史 1）
        const isblock = Number(data.dataValues.isblock)
        if (isblock === 20 || isblock === 1) {
            return 20
        }
        // 添加token
        data = {
            id: data.dataValues.id,
            loginId: data.dataValues.loginId,
            name: data.dataValues.name,
            roleId: data.dataValues.roleId
        }
        //如果请求体有remember就7天，不存在则1天
        let loginPeriod = null;
        if(loginInfo.remember){
            // 如果用户勾选了7天,则赋值remember=7
            loginPeriod = parseInt(loginInfo.remember)
        }else{
            loginPeriod = 1
        }
        // 生成token 存入用户相关信息
        const token = jwt.sign(data, md5(process.env.JWT_SECRET), { expiresIn: 60 * 60 * 24 * loginPeriod })
        // 记录最近登录时间（统计"今日活跃"用，异步不阻塞登录）
        updateLastLoginDao(data.id).catch(() => {})
        return {
            token,data
        }
    }
    return data
}

// 注册
module.exports.registService = async function(registInfo){
   // 检查是否有同样的用户名
   const data = await getInfo(registInfo.loginId)
   if(data){
     return false;
   }else{
        // 密码加密
        registInfo.loginPwd = md5(registInfo.loginPwd)
        const info = await registDao(registInfo)
         // 添加token
        const data = {
            id: info.id,
            loginId: info.loginId,
            name: info.name,
            roleId: info.roleId
        }
        // 注册用户默认7天
        const token = jwt.sign(data, md5(process.env.JWT_SECRET), { expiresIn: 60 * 60 * 24 * 7 })
        data.token = token
        return data
   }
   
}