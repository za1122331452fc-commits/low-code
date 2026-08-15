// 引包
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const md5 = require('md5')
const {ForbiddenError, UnknownError} = require('./utils/error')
// 验证客户端token的中间件
const { expressjwt } = require('express-jwt')
const session = require("express-session")
// 默认读取env文件中的环境变量
require('dotenv').config();
// 引入数据库连接
require('./dao/db');
const { ServiceError } = require('./utils/error')
// 引入路由
var userRouter = require('./routes/user');
var captcha = require('./routes/captcha')
var uploadRouter = require('./routes/upload')
var surveyRouter = require('./routes/survey')
var quizRouter = require('./routes/quiz')

// 创建 服务器 实例 
var app = express();

// 信任代理：使 req.ip 能正确解析 X-Forwarded-For 中的真实客户端 IP
app.set('trust proxy', true);

// 注册session
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:true, //不管 Session 有没有变化，每次都重新保存到存储中
  saveUninitialized:true, // 每次新访客都创建一个空的 Session
  cookie: {
    httpOnly: true
  }
}))

// 使用中间件
app.use(logger('dev'));
// 调大请求体限制（问卷 coms 可能较大，默认 100kb 会报 413/500）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
// 图片静态资源
app.use(express.static(path.join(__dirname, 'public')));

// 验证token的中间件
app.use(expressjwt({ 
  secret: md5(process.env.JWT_SECRET), // 签名的密钥
  algorithms: ['HS256'] // 指定算法
 }).unless({ 
  // 不需要验证token的接口地址
    path:[
      { "url":'/api/user/login',
        methods:['POST']
       },
      { "url":'/res/captcha',
        methods:['GET']
       },
      {
        "url":'/api/user/regist',
        methods:['POST']
      },
      // 公开答题：获取在线问卷 + 提交答案
      {
        "url": /^\/api\/quiz\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        methods:['GET']
      },
      {
        "url": /^\/api\/quiz\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/submit$/,
        methods:['POST']
      },
      // 公开浏览：问卷列表 + 问卷详情（无需登录即可查看，写操作仍需登录）
      { "url": '/api/survey', methods:['GET'] },
      { "url": /^\/api\/survey\/\d+$/, methods:['GET'] }
    ]
}));

// 使用路由中间件
app.use('/api/user', userRouter);
app.use('/res/captcha', captcha);
app.use('/api', uploadRouter);
app.use('/api/survey', surveyRouter);
app.use('/api/quiz', quizRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// 错误处理
app.use(function(err, req, res, next) {
  // 打印真实错误，便于定位问题
  console.error('[server error]', err && err.message, err && err.stack)
  // token验证失败,抛出错误
 if(err.name === 'UnauthorizedError'){
   res.send(new ForbiddenError("未登录或登录过期").toResponseJSON())
   return;
 }
 // 其他业务错误
   if (err instanceof ServiceError) {
    const response = err.toResponseJSON()
   res.send(response)
    return;
  }
  res.send(new UnknownError().toResponseJSON())
});


module.exports = app;
