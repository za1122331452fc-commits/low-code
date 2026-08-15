// 文件上传路由
var express = require('express')
var path = require('path')
var fs = require('fs')
var multer = require('multer')
const { formatResponse } = require('../utils/tool')
const { UploadError, UnknownError } = require('../utils/error')

var router = express.Router()

// 上传目录
const uploadDir = path.join(__dirname, '..', 'public', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 存储配置：保留原扩展名，使用时间戳 + 随机数命名避免重名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ''
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext)
  },
})

// 仅允许图片类型，单文件字段名为 image（对应前端 el-upload 的 name="image"）
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    const allowTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (allowTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持上传图片文件'))
    }
  },
})

// 上传接口
router.post('/upload', upload.single('image'), function (req, res, next) {
  if (!req.file) {
    res.send(new UploadError('未接收到文件').toResponseJSON())
    return
  }
  // 返回可访问的 URL（通过 Vite 代理 /uploads 到后端）
  const imageUrl = '/uploads/' + req.file.filename
  res.send(formatResponse(200, '上传成功', { imageUrl }))
})

// multer 文件过滤等错误处理
router.use(function (err, req, res, next) {
  if (err instanceof multer.MulterError) {
    res.send(new UploadError(err.message).toResponseJSON())
    return
  }
  if (err && err.message) {
    res.send(new UploadError(err.message).toResponseJSON())
    return
  }
  res.send(new UnknownError().toResponseJSON())
})

module.exports = router
