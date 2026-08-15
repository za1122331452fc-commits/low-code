const {DataTypes} = require('sequelize');
const sequelize = require('../dbConnect');

// 定义用户模型
module.exports = sequelize.define('user', {
    loginId:{
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false
    },
    loginPwd:{
        type: DataTypes.STRING,
        allowNull: false
    },
    // 10 管理员 20 普通用户
    roleId:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isblock:{
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 10

    },
    // 注册时间
    createDate:{
      type: DataTypes.BIGINT,
      allowNull: true
    },
    // 最近登录时间
    lastLoginDate:{
      type: DataTypes.BIGINT,
      allowNull: true
    }
},{
    freezeTableName: true, // 禁止自动复数化表名
    timestamps: false, // 禁止自动添加 createdAt 和 updatedAt 字段
    updatedAt: false, // 禁止自动添加 updatedAt 字段
});