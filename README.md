# 低代码问卷平台
官方链接 ：http://njz.dpdns.org

一个前后端分离的全栈低代码问卷系统：支持 Schema 驱动的可视化问卷编辑器、组件市场、在线发布答题、统计报表、PDF 答题卡导出以及后台用户/问卷管理。
- 前端：Vue 3 + TypeScript + Vite + Pinia + Element Plus + TanStack Query
- 后端：Express + JWT + Sequelize(MySQL) 

---

## 功能特性

### 编辑器
- **Schema 驱动的低代码构建器**：组件注册表+ 数据驱动的配置面板，新增题型只需注册一行，配置面板零改动
- **撤销/重做**：命令式历史链 + 50 层栈深度限制，低内存占用
- **双数据源**：IndexedDB 本地缓存优先 + 服务端持久化兜底，编辑问卷秒开
- **分片渲染**：大问卷先渲染首屏，`requestAnimationFrame` 分批追加，避免卡顿

### 问卷全流程
- 组件市场（选择类 / 填空类 / 高级类 / 备注类 / 设定类 ）
- 预览、在线发布答题、答题统计、答题明细
- **PDF 答题卡导出**：单次 html2canvas 截图 + 坐标切片分页

### 工程与安全
- TanStack Query 统一管理服务端状态（缓存 / 去重 / 失效刷新）
- 路由级代码分割 + 空闲预加载编辑器 chunk
- JWT 鉴权、管理员权限、数据归属校验、IP 限流、图形验证码

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vue 3 (Composition API)、Vue Router、Pinia、TanStack Vue Query、Axios、Dexie(IndexedDB)、Element Plus、Font Awesome、vuedraggable、jspdf + html2canvas |
| 后端 | Express 4、express-jwt(HS256)、Sequelize 6(MySQL)、svg-captcha、md5、dotenv |
| 构建 | Vite 5、vue-tsc、ESLint、Prettier、Sass |

---

## 项目结构

```
项目成品/
├── survey/                  # 前端（Vue 3 + TS + Vite）
│   └── src/
│       ├── views/           # 页面：首页/登录/编辑器/组件市场/预览/答题/统计
│       ├── components/
│       │   └── SurveyComs/  # 问卷组件（Materials 市场 / EditItems 编辑 / Common 共用 / PdfComs 答题卡）
│       ├── stores/          # Pinia：useEditor(编辑器核心)、useMaterial(组件市场)、useHistory(撤销重做)
│       ├── composables/     # TanStack Query 
│       ├── configs/         # 组件映射、默认状态
│       ├── db/              # Dexie 
│       └── api/             # Axios 
└── low-code/                # Express
    ├── routes/              # user / captcha / survey / quiz / upload
    ├── service/             # 业务逻辑层
    ├── dao/                 # Sequelize 模型 + DAO
    ├── utils/               # 错误体系、限流、响应格式化
    └── public/uploads/      # 图片上传目录
```

---

## 快速开始

### 前置要求
- Node.js ≥ 18
- MySQL 5.7+

### 1. 启动后端

```bash
npm install
```

创建 `.env` 文件：

```ini
# MySQL 连接
DB_NAME=low-code
DB_USER=root
DB_PASS=你的密码
DB_HOST=localhost

# 鉴权密钥
JWT_SECRET=任意字符串
SESSION_SECRET=任意字符串
```

启动（首次启动自动建表，并自动创建管理员 `admin / 密码`）：

```bash
npm start      
```

### 2. 启动前端（survey）

```bash
cd survey
npm install
npm run dev   
```

> 首次登录用管理员账号 `admin / 密码`。

---

## 常用命令

### 前端（survey）
```bash
npm run dev            
npm run build          
npm run type-check    
npm run lint           
npm run format         
```

### 后端（low-code）
```bash
npm start             
```

---

## 打包部署

### 前端
```bash
cd survey && npm run build    
```

### 后端
后端为纯 Node，无需构建，打包源码即可


### Nginx 部署前端

```nginx
server {
  listen 80;
  root /path/to/survey/dist;
  index index.html;

  location /api/      { proxy_pass http://127.0.0.1:3000; }
  location /res/      { proxy_pass http://127.0.0.1:3000; }
  location /uploads/  { proxy_pass http://127.0.0.1:3000; }

  location / { try_files $uri $uri/ /index.html; } 
}
```

> 生产环境务必开启 gzip，建议配置 HTTPS（`navigator.clipboard` 仅在 HTTPS/localhost 可用）。

---

## 使用说明

1. **游客**：可自由浏览平台（首页/编辑器/组件市场/预览），保存问卷、发布在线问卷时需要登录。
2. **普通用户**：创建/编辑问卷 → 预览 → 发布在线问卷 → 分享链接 → 查看统计与答题明细。
3. **管理员**：管理所有用户（启用/禁用、查看用户统计）和问卷（禁用违规问卷）。

