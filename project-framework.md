# 项目框架：AI智能回访话术生成系统

## 1. 技术选型

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| 前端 | Vue 3 + Vite + Element Plus | 老师端与管理后台共用一套技术栈，通过路由权限区分 |
| 后端 | Node.js + NestJS | 模块化架构，便于多Agent并行开发 |
| 数据库 | MySQL 8.0 + TypeORM | 关系型数据，事务支持完善 |
| 缓存 | Redis | 会话缓存、话术生成限流、热点数据 |
| AI能力 | Claude API / OpenAI API | 话术生成核心引擎，Prompt缓存降低成本 |
| 文件存储 | 本地/MinIO | Excel上传、导出文件存储 |
| 部署 | Docker Compose | 开发环境一键启动，生产可迁移至K8s |

## 2. 项目目录结构

```
ai-feedback-system/
├── docker-compose.yml              # 开发环境编排
├── .env.example                    # 环境变量模板
├── README.md                       # 项目说明
│
├── frontend/                       # 前端应用 (Vue 3)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts                 # 入口
│   │   ├── App.vue
│   │   ├── router/                 # 路由配置
│   │   │   ├── index.ts
│   │   │   ├── teacher.routes.ts   # 老师端路由
│   │   │   └── admin.routes.ts     # 管理后台路由
│   │   ├── stores/                 # Pinia状态管理
│   │   │   ├── auth.store.ts
│   │   │   ├── upload.store.ts
│   │   │   └── script.store.ts
│   │   ├── api/                    # API请求层
│   │   │   ├── request.ts          # Axios封装
│   │   │   ├── auth.api.ts
│   │   │   ├── upload.api.ts
│   │   │   ├── script.api.ts
│   │   │   └── admin.api.ts
│   │   ├── views/                  # 页面视图
│   │   │   ├── login/              # 登录页
│   │   │   ├── teacher/            # 老师端
│   │   │   │   ├── dashboard/      # 数据上传页
│   │   │   │   ├── script-list/    # 话术列表页
│   │   │   │   ├── student-eval/   # 学员评估页
│   │   │   │   └── export/         # 批量导出页
│   │   │   └── admin/              # 管理后台
│   │   │       ├── dashboard/      # 统计看板
│   │   │       ├── teacher-mgmt/   # 老师管理
│   │   │       └── settings/       # 系统设置
│   │   ├── components/             # 公共组件
│   │   │   ├── ScriptEditor.vue    # 话术编辑器
│   │   │   ├── DataUpload.vue      # 数据上传组件
│   │   │   ├── StudentCard.vue     # 学员信息卡片
│   │   │   └── ExportDialog.vue    # 导出弹窗
│   │   └── utils/                  # 工具函数
│   │       ├── excel-parser.ts     # Excel解析
│   │       └── formatters.ts       # 格式化
│   └── public/
│       └── template.xlsx           # 上传模板下载
│
├── backend/                        # 后端应用 (NestJS)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── src/
│   │   ├── main.ts                 # 应用入口
│   │   ├── app.module.ts           # 根模块
│   │   ├── config/                 # 配置模块
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── ai.config.ts
│   │   ├── common/                 # 公共模块
│   │   │   ├── filters/            # 异常过滤器
│   │   │   ├── interceptors/       # 拦截器
│   │   │   ├── guards/             # 守卫
│   │   │   └── decorators/         # 装饰器
│   │   ├── modules/
│   │   │   ├── auth/               # 认证模块
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   ├── user/               # 用户模块
│   │   │   │   ├── user.module.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.entity.ts
│   │   │   │   └── dto/
│   │   │   ├── student/            # 学员模块
│   │   │   │   ├── student.module.ts
│   │   │   │   ├── student.controller.ts
│   │   │   │   ├── student.service.ts
│   │   │   │   ├── student.entity.ts
│   │   │   │   └── dto/
│   │   │   ├── upload/             # 数据上传模块
│   │   │   │   ├── upload.module.ts
│   │   │   │   ├── upload.controller.ts
│   │   │   │   ├── upload.service.ts
│   │   │   │   ├── excel-parser.service.ts
│   │   │   │   └── dto/
│   │   │   ├── course-data/        # 课程数据模块
│   │   │   │   ├── course-data.module.ts
│   │   │   │   ├── course-data.controller.ts
│   │   │   │   ├── course-data.service.ts
│   │   │   │   └── course-data.entity.ts
│   │   │   ├── script/             # 话术模块
│   │   │   │   ├── script.module.ts
│   │   │   │   ├── script.controller.ts
│   │   │   │   ├── script.service.ts
│   │   │   │   ├── script.entity.ts
│   │   │   │   └── dto/
│   │   │   ├── ai-engine/          # AI引擎模块
│   │   │   │   ├── ai-engine.module.ts
│   │   │   │   ├── ai-engine.service.ts
│   │   │   │   ├── prompt-templates/
│   │   │   │   │   ├── base.template.ts
│   │   │   │   │   ├── excellent.template.ts
│   │   │   │   │   ├── absent.template.ts
│   │   │   │   │   ├── struggling.template.ts
│   │   │   │   │   ├── low-interaction.template.ts
│   │   │   │   │   └── low-completion.template.ts
│   │   │   │   └── dto/
│   │   │   ├── eval/               # 学员评估模块
│   │   │   │   ├── eval.module.ts
│   │   │   │   ├── eval.controller.ts
│   │   │   │   ├── eval.service.ts
│   │   │   │   ├── eval.entity.ts
│   │   │   │   └── dto/
│   │   │   ├── export/             # 导出模块
│   │   │   │   ├── export.module.ts
│   │   │   │   ├── export.controller.ts
│   │   │   │   ├── export.service.ts
│   │   │   │   └── generators/
│   │   │   │       ├── word.generator.ts
│   │   │   │       ├── excel.generator.ts
│   │   │   │       └── pdf.generator.ts
│   │   │   └── admin/              # 管理后台模块
│   │   │       ├── admin.module.ts
│   │   │       ├── admin.controller.ts
│   │   │       ├── admin.service.ts
│   │   │       └── dto/
│   │   └── database/
│   │       ├── migrations/           # 数据库迁移
│   │       └── seeds/                # 种子数据
│   └── Dockerfile
│
├── ai-agents/                      # AI Agent配置与Prompt工程
│   ├── prompts/
│   │   ├── system-prompt.md          # 系统级Prompt
│   │   ├── excellent-scenario.md
│   │   ├── absent-scenario.md
│   │   ├── struggling-scenario.md
│   │   ├── low-interaction-scenario.md
│   │   └── low-completion-scenario.md
│   └── schemas/
│       └── output-schema.json        # AI输出结构化Schema
│
└── ops/                            # 运维配置
    ├── docker/
    │   ├── nginx.conf
    │   ├── mysql.cnf
    │   └── redis.conf
    └── scripts/
        ├── init-db.sh
        └── backup.sh
```

## 3. 模块划分与Agent协作

| Agent | 负责模块 | 输入 | 输出 |
|-------|---------|------|------|
| **Auth Agent** | 认证授权 | 登录凭证 | JWT Token、权限控制 |
| **Upload Agent** | Excel解析与数据入库 | Excel文件 | 解析后的CourseData记录 |
| **Data Agent** | 课程数据查询与管理 | 学员ID、周次 | 课程数据DTO |
| **AI Engine Agent** | 话术生成核心 | 课程数据+场景模板 | 结构化话术文本 |
| **Script Agent** | 话术CRUD与状态管理 | 生成的话术 | 持久化话术记录 |
| **Eval Agent** | 学员状态评估 | 评估表单 | 评估记录+二次生成话术 |
| **Export Agent** | 文件导出 | 话术列表+模板 | Word/Excel/PDF文件 |
| **Admin Agent** | 后台统计与管理 | 查询条件 | 统计报表、账号管理 |

## 4. 核心API设计

### 4.1 认证模块
```
POST   /api/auth/login          # 登录
POST   /api/auth/logout         # 登出
GET    /api/auth/profile        # 获取当前用户信息
```

### 4.2 数据上传模块
```
POST   /api/upload/excel        # 上传Excel文件
GET    /api/upload/history      # 上传历史列表
GET    /api/upload/template     # 下载标准模板
DELETE /api/upload/:batchId     # 删除某批次数据
```

### 4.3 话术模块
```
GET    /api/scripts             # 话术列表（支持周次、班级筛选）
GET    /api/scripts/:id         # 单条话术详情
POST   /api/scripts/generate    # 手动触发生成
PUT    /api/scripts/:id         # 编辑话术
POST   /api/scripts/batch-copy  # 批量复制
GET    /api/scripts/stats       # 话术统计
```

### 4.4 学员评估模块
```
POST   /api/evaluations         # 提交评估
PUT    /api/evaluations/:id     # 更新评估
POST   /api/evaluations/:id/generate  # 基于评估生成话术
```

### 4.5 导出模块
```
POST   /api/export              # 发起导出任务
GET    /api/export/:taskId      # 查询导出进度
GET    /api/export/:taskId/download  # 下载文件
```

### 4.6 管理后台模块
```
GET    /api/admin/dashboard     # 周度数据看板
GET    /api/admin/teachers      # 老师列表
POST   /api/admin/teachers      # 新增老师
PUT    /api/admin/teachers/:id  # 编辑老师
DELETE /api/admin/teachers/:id  # 删除老师
GET    /api/admin/scripts       # 全量话术抽查
PUT    /api/admin/settings      # 系统设置
```

## 5. 数据库设计

### 5.1 用户表 (users)
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role ENUM('teacher', 'admin') NOT NULL DEFAULT 'teacher',
  name VARCHAR(50) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  employee_no VARCHAR(50),           -- 工号
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5.2 学员表 (students)
```sql
CREATE TABLE students (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(50),               -- 教务系统用户ID
  name VARCHAR(50) NOT NULL,
  teacher_id BIGINT NOT NULL,
  class_id VARCHAR(50),
  class_name VARCHAR(100),
  camp_name VARCHAR(100),            -- 营期名
  parent_contact VARCHAR(50),        -- 家长联系方式
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);
```

### 5.3 课程数据表 (course_data)
```sql
CREATE TABLE course_data (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  user_id VARCHAR(50),
  user_name VARCHAR(50),
  employee_no VARCHAR(50),
  teacher_name VARCHAR(50),
  camp_name VARCHAR(100),
  class_id VARCHAR(50),
  class_name VARCHAR(100),
  course_seq INT,
  lesson_id VARCHAR(50),
  course_id VARCHAR(50),
  course_name VARCHAR(200) NOT NULL,
  is_attended BOOLEAN,
  is_late BOOLEAN,
  is_early_leave BOOLEAN,
  is_absent BOOLEAN,
  effective_duration INT,            -- 有效上课时长(分钟)
  is_completed BOOLEAN,              -- 是否完课
  is_playback_completed BOOLEAN,     -- 是否回放完课
  playback_duration INT,             -- 回放观看时长
  in_class_question_count INT,
  in_class_completion_rate DECIMAL(5,2),
  in_class_accuracy DECIMAL(5,2),
  homework_question_count INT,
  homework_completion_rate DECIMAL(5,2),
  homework_accuracy DECIMAL(5,2),
  extension_question_count INT,
  extension_completion_rate DECIMAL(5,2),
  extension_accuracy DECIMAL(5,2),
  mic_duration INT,                  -- 开麦时长
  camera_duration INT,               -- 开摄像头时长
  trophy_count INT DEFAULT 0,        -- 奖杯数
  lesson_start_time DATETIME,
  lesson_end_time DATETIME,
  week_label VARCHAR(20),            -- 数据周次 (如: 2026W16)
  upload_batch VARCHAR(50),          -- 上传批次ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### 5.4 状态评估表 (status_evaluations)
```sql
CREATE TABLE status_evaluations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  week_label VARCHAR(20) NOT NULL,
  learning_attitude VARCHAR(50),     -- 学习态度
  knowledge_mastery VARCHAR(50),     -- 知识掌握
  homework_quality VARCHAR(50),      -- 作业质量
  class_interaction VARCHAR(50),     -- 课堂互动
  concerns TEXT,                     -- 需关注事项
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### 5.5 话术表 (scripts)
```sql
CREATE TABLE scripts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  source_type ENUM('course_data', 'status_eval') NOT NULL,
  source_id BIGINT,                  -- 关联的course_data或evaluation ID
  generated_content TEXT NOT NULL,   -- AI生成原始内容
  is_edited BOOLEAN DEFAULT FALSE,
  final_content TEXT,                -- 老师编辑后最终内容
  status ENUM('generated', 'edited', 'exported', 'used') DEFAULT 'generated',
  scenario_type VARCHAR(50),         -- 场景类型: excellent, absent, struggling...
  week_label VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### 5.6 系统设置表 (system_settings)
```sql
CREATE TABLE system_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 6. AI Prompt工程

### 6.1 基础Prompt结构
```
你是一位资深的少儿编程C++教培老师，擅长撰写家长回访话术。
请根据以下学员数据，生成一段亲切、专业、有针对性的回访话术。

【学员数据】
- 学员姓名: {{userName}}
- 课程名称: {{courseName}}
- 出勤状态: {{attendanceStatus}}
- 有效上课时长: {{duration}}分钟
- 课中题目正确率: {{inClassAccuracy}}%
- 课后作业正确率: {{homeworkAccuracy}}%
- 拓展练习正确率: {{extensionAccuracy}}%
- 获得奖杯数: {{trophyCount}}
- 课堂互动: 开麦{{micDuration}}分钟, 开摄像头{{cameraDuration}}分钟

【场景判断】
{{scenarioType}}

【输出要求】
1. 严格按以下模块输出：
   【授课内容】
   【课中表现】
   【下节课预告】（如适用）
   【本周任务】
2. 用{{userName}}称呼学员，语气亲切自然
3. 数据引用要准确，不要编造未提供的数据
4. 总字数控制在300-500字
```

### 6.2 场景判断规则
```typescript
function detectScenario(data: CourseData): ScenarioType {
  if (!data.is_attended || data.is_absent) return 'absent';
  if (data.in_class_accuracy < 60 && data.homework_accuracy >= 80) return 'struggling';
  if (data.homework_completion_rate < 50 || !data.is_completed) return 'low-completion';
  if (data.mic_duration < 10 && data.camera_duration < 10) return 'low-interaction';
  if (data.in_class_accuracy >= 90 && data.homework_accuracy >= 90) return 'excellent';
  return 'normal';
}
```

## 7. 开发阶段规划

### Phase 1: 基础框架搭建 (Day 1-2)
- [ ] Docker Compose环境配置 (MySQL + Redis + NestJS + Vue)
- [ ] 数据库迁移脚本
- [ ] 前端路由与基础布局
- [ ] 用户认证模块 (登录/登出/JWT)

### Phase 2: 核心数据流 (Day 3-5)
- [ ] Excel上传与解析
- [ ] 课程数据入库与查询
- [ ] 学员信息自动关联
- [ ] 上传历史管理

### Phase 3: AI话术引擎 (Day 6-9)
- [ ] AI服务封装与错误处理
- [ ] 场景判断逻辑
- [ ] Prompt模板系统
- [ ] 话术生成API
- [ ] 话术列表与编辑

### Phase 4: 评估与导出 (Day 10-12)
- [ ] 学员状态评估表单
- [ ] 基于评估的二次生成
- [ ] Word/Excel/PDF导出
- [ ] 批量导出任务队列

### Phase 5: 管理后台 (Day 13-15)
- [ ] 数据统计看板
- [ ] 老师账号管理
- [ ] 话术质量抽查
- [ ] 系统设置

### Phase 6: 测试与优化 (Day 16-18)
- [ ] 单元测试覆盖核心逻辑
- [ ] 集成测试 (上传→生成→导出)
- [ ] AI生成质量调优
- [ ] 性能测试 (120学员批量生成)

## 8. 环境变量配置

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=ai_feedback

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI API
AI_PROVIDER=anthropic  # 或 openai
AI_API_KEY=sk-xxx
AI_MODEL=claude-sonnet-4-6

# App
APP_PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 9. 启动命令

```bash
# 1. 启动基础设施
docker-compose up -d mysql redis

# 2. 后端启动
cd backend
npm install
npm run migration:run
npm run start:dev

# 3. 前端启动
cd frontend
npm install
npm run dev

# 4. 访问
# 前端: http://localhost:5173
# 后端API: http://localhost:3000/api
# API文档: http://localhost:3000/api/docs (Swagger)
```
