const { DataTypes } = require('sequelize')
const sequelize = require('../dbConnect')

// 答题记录（一份提交一行）
module.exports = sequelize.define(
  'answer',
  {
    quizId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // 答案 JSON，按题号 {1: ..., 2: ...}
    answers: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    // 提交者 IP（用于防刷/统计去重）
    ip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createDate: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    updatedAt: false,
  }
)
