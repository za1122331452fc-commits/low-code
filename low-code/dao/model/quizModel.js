const { DataTypes } = require('sequelize')
const sequelize = require('../dbConnect')

// 在线问卷实例（发布即快照，答题/统计都以该表为准）
module.exports = sequelize.define(
  'quiz',
  {
    // 链接标识（uuid），用于公开访问
    quizId: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '未命名问卷',
    },
    // 发布者用户 id
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // 来源问卷 id（用于判断问卷被禁用后停用在线问卷）
    surveyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // 问卷内容（组件数组）JSON 字符串
    coms: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    surveyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
