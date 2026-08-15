const { DataTypes } = require('sequelize')
const sequelize = require('../dbConnect')

// 问卷模型
module.exports = sequelize.define('survey', {
  // 归属用户
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // 时间戳存为 BIGINT，前端以 number 处理
  createDate: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  updateDate: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  surveyCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  // 问卷内容以 JSON 字符串存储；MySQL 的 TEXT 列不允许设置默认值
  coms: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  // 是否被管理员禁用
  isblock: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  freezeTableName: true,
  timestamps: false,
  updatedAt: false,
})
