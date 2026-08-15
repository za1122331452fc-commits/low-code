// 初始化数据库
const md5 = require('md5')
// 数据库连接实例
const sequelize = require('./dbConnect');

// 数据模型
const userModel = require('./model/userModel');
const surveyModel = require('./model/surveyModel');
const quizModel = require('./model/quizModel');
const answerModel = require('./model/answerModel');

(async ()=>{
    sequelize.sync({
        alter: true, // 自动更新表结构
    })
    // 初始化管理员数据
    const adminCount = await userModel.count({ where: { roleId: 10 } });
    if (adminCount === 0) {
        await userModel.create({
            loginId: 'admin',
            name: '管理员',
            loginPwd: md5('******'), // 默认密码
            roleId: 10,
        });

    }
    console.log('Database initialized successfully');
})()