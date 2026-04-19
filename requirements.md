# AI回访话术生成系统 — 需求文档

## 1. 项目概述

为少儿编程C++教培机构打造的话术生成工具。老师上传课程数据后，逐一对学生状态进行调整确认，再由AI生成个性化回访话术，支持批量下载。管理员可查看全量数据。

---

## 2. 用户角色

| 角色 | 权限 |
|------|------|
| 老师 | 登录、上传表格、调整学生状态、生成话术、修改话术、批量下载 |
| 管理员 | 登录、查看所有老师生成的话术数据 |

---

## 3. 功能需求

### 3.1 登录
- 支持老师和管理员统一登录入口
- **工号 + 密码** 认证（老师使用教务系统工号登录）
- 管理员在后台为老师创建账号，分配工号和初始密码
- 密码使用 bcrypt 单向哈希存储，禁止明文保存
- 登录成功后返回 JWT Token，前端存储用于后续请求鉴权
- 提供修改密码接口（可选）：老师可自行修改密码，需验证旧密码，新密码不可与工号相同，长度不少于6位

### 3.2 表格上传（老师）
- 支持上传 Excel/CSV 格式的课程数据
- 上传字段需包含：**用户姓名**、**课节开始时间（上课时间）** 及用于状态判断和话术生成的相关字段
- 支持重复上传：同一老师上传同一周数据时，新数据覆盖旧数据
- 上传后系统解析并在页面上展示本周学生列表

### 3.3 学生状态调整（老师）
- 上传数据后，老师在生成话术**之前**，需逐一对每个学生进行状态确认
- 状态调整项包括但不限于：
  - 出勤状态确认
  - 课堂表现评价（可选：优秀 / 良好 / 一般 / 需关注）
  - 作业完成情况确认
  - 其他需备注事项
- 状态调整后保存，作为后续AI生成话术的输入依据

### 3.4 AI话术生成
- 学生状态调整完成后，逐条或批量触发生成
- AI根据学生课程数据 + 老师确认后的状态，生成个性化回访话术
- 生成的话术按标准结构输出：授课内容、课中表现、下节课预告、本周任务（视场景调整）

### 3.5 话术修改（老师）
- 生成的话术展示在列表中，老师可逐条在线编辑
- 支持单行复制
- 编辑后的内容即为最终话术

### 3.6 批量下载（老师）
- 支持选择本周/本班/全量学生进行批量导出
- 导出表格**仅包含三列**：
  - 用户姓名
  - 上课时间（课节开始时间）
  - 话术（最终内容，若已编辑则为编辑后内容）
- 导出格式：Excel (.xlsx)

### 3.7 数据查看（管理员）
- 管理员登录后进入后台
- 可查看所有老师生成的话术数据
- 支持按老师姓名、周次、班级筛选
- 列表展示：老师姓名、学员姓名、上课时间、话术内容

---

## 4. 页面规划

| 页面 | 角色 | 说明 |
|------|------|------|
| 登录页 | 共用 | 工号+密码登录 |
| 上传页 | 老师 | 上传Excel/CSV，展示解析结果 |
| 状态调整页 | 老师 | 逐一对学生进行状态确认与调整 |
| 话术列表页 | 老师 | 展示生成的话术，支持编辑、复制、批量下载 |
| 后台数据页 | 管理员 | 查看所有老师的话术数据，支持筛选 |

---

## 5. 数据模型

### 5.1 用户表 (users)
```
id              BIGINT PK
role            ENUM('teacher', 'admin')
name            VARCHAR(50)       -- 老师姓名
employee_no     VARCHAR(50) UNIQUE NOT NULL  -- 工号（登录账号）
password_hash   VARCHAR(255)      -- bcrypt哈希密码
status          ENUM('active', 'disabled') DEFAULT 'active'  -- 账号状态
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 5.2 学员数据表 (student_data)
```
id                  BIGINT PK
user_name           VARCHAR(50)       -- 用户姓名
teacher_id          BIGINT            -- 所属老师
class_name          VARCHAR(100)      -- 班级名
course_name         VARCHAR(200)      -- 课程名称
lesson_start_time   DATETIME          -- 上课时间（课节开始时间）
is_attended         BOOLEAN           -- 是否到课
is_absent           BOOLEAN           -- 是否旷课
effective_duration  INT               -- 有效上课时长
homework_accuracy   DECIMAL(5,2)      -- 课后正确率
extension_accuracy  DECIMAL(5,2)      -- 拓展正确率
trophy_count        INT               -- 奖杯数
mic_duration        INT               -- 开麦时长
camera_duration     INT               -- 开摄像头时长
week_label          VARCHAR(20)       -- 数据周次
upload_batch        VARCHAR(50)       -- 上传批次
created_at          TIMESTAMP
```

### 5.3 状态调整记录表 (student_status)
```
id                  BIGINT PK
student_data_id     BIGINT            -- 关联学员数据
teacher_id          BIGINT            -- 操作老师
attendance_status   VARCHAR(20)       -- 出勤状态确认
performance_level   VARCHAR(20)       -- 课堂表现评价
homework_status     VARCHAR(50)       -- 作业情况确认
remarks             TEXT              -- 备注事项
is_confirmed        BOOLEAN DEFAULT FALSE
confirmed_at        TIMESTAMP
```

### 5.4 话术表 (scripts)
```
id                  BIGINT PK
student_data_id     BIGINT            -- 关联学员数据
teacher_id          BIGINT            -- 所属老师
content             TEXT              -- AI生成的原始话术
final_content       TEXT              -- 老师编辑后的最终话术
week_label          VARCHAR(20)       -- 周次
is_edited           BOOLEAN DEFAULT FALSE
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

---

## 6. 核心业务流程

```
老师登录（工号+密码）
  → 进入上传页，上传本周课程数据
  → 系统解析展示学生列表
  → 进入状态调整页，逐一对每个学生进行状态确认
  → 状态确认完成后，点击生成话术
  → AI根据数据+状态生成话术
  → 进入话术列表页，逐条查看/编辑话术
  → 批量下载（用户姓名 + 上课时间 + 话术）

管理员登录
  → 进入后台数据页
  → 查看所有老师的话术数据，支持筛选
```

---

## 7. 技术栈建议

| 层级 | 选型 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus |
| 后端 | Node.js + NestJS |
| 数据库 | MySQL 8.0 |
| ORM | TypeORM |
| AI接口 | Claude API / OpenAI API |
| 导出 | xlsx (npm包) |
| 部署 | Docker Compose |

---

## 8. 边界与约束

- 老师只能查看和操作自己上传的数据
- 状态调整是生成话术的**前置必要条件**，未调整状态的学生不可生成话术
- 批量下载的表格字段固定为：用户姓名、上课时间、话术，不可配置
- 重复上传时，以最新上传的数据为准，覆盖同周次历史数据
- 管理员不可修改话术，仅可查看
- 密码安全约束：
  - 密码最小长度 6 位
  - 新密码不可与工号相同
  - 密码采用 bcrypt 哈希存储，禁止明文或弱加密
  - 账号被禁用（`status = disabled`）后无法登录
