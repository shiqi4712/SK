# AI智能回访话术生成系统

## 项目结构

```
SK/
├── backend/          NestJS 后端
├── frontend/         Vue3 + Element Plus 前端
├── gaid.md           产品构想
├── requirements.md   需求文档
├── ui-design-spec.md UI设计规范
└── README.md         本文件
```

## 环境准备

1. **Node.js** (已验证 v24.14.1)
2. **MySQL** (本地开发需要安装，推荐 XAMPP 或 MySQL Installer)
3. **DeepSeek API Key** (注册 deepseek.com 获取)

## 快速启动

### 1. 配置环境变量

复制 `backend/.env.example` 为 `backend/.env` 并编辑：

```bash
# 数据库配置（根据你的MySQL修改）
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=ai_feedback

# DeepSeek API
DEEPSEEK_API_KEY=sk-your-key-here
```

### 2. 创建数据库

在MySQL中执行：
```sql
CREATE DATABASE ai_feedback CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 启动后端

```bash
cd backend
npm run start:dev
```

后端将运行在 `http://localhost:3000/api`

首次启动会自动创建数据表，并生成默认管理员账号：
- 工号: `admin`
- 密码: 取决于 .env 中的 ADMIN_INITIAL_PASSWORD

### 4. 启动前端

```bash
cd frontend
npm run dev
```

前端将运行在 `http://localhost:5173`

### 5. 登录测试

打开 `http://localhost:5173`

使用默认管理员账号登录。

## 主要功能

| 模块 | 状态 |
|------|------|
| 工号密码登录 | ✅ |
| Excel上传解析 | ✅ |
| 学员状态调整 | ✅ |
| DeepSeek AI话术生成 | ✅ |
| 话术编辑复制 | ✅ |
| 批量导出Excel | ✅ |
| 管理员查看全量数据 | ✅ |
| 老师账号管理 | ✅ |

## API 接口

| 接口 | 说明 |
|------|------|
| POST /api/auth/login | 登录 |
| POST /api/upload/excel | 上传课程数据 |
| GET /api/status | 状态列表 |
| POST /api/status/:id | 保存状态 |
| GET /api/scripts | 话术列表 |
| POST /api/scripts/generate/:id | 生成话术 |
| PUT /api/scripts/:id | 编辑话术 |
| POST /api/export/excel | 批量导出 |
| GET /api/admin/scripts | 管理员查看全量 |

## 下一步

1. 在管理员后台创建老师账号
2. 老师登录后上传Excel课程数据
3. 逐一对学员进行状态确认
4. 点击生成话术
5. 编辑、复制或批量导出话术
