
# 核心数据接口

   * 认证 (Auth)
       * POST /api/auth/login: 用户登录。
       * POST /api/auth/reset-secrets: 重置认证密钥。

   * 数据查询 (Read)
       * GET /api/list/{type}: 获取指定类型的数据列表 (例如 /api/list/works)。
       * GET /api/get/{type}: 按UUID获取单个项目的详细信息 (例如 /api/get/work?uuid=...)。
           * 参数 full=true (/api/get/work?uuid=...&full=true) 可用于获取更完整的关联数据。
       * GET /api/search: 根据关键词搜索 (例如 /api/search?keyword=...)。

   * 数据修改 (Write)
       * POST /api/input/{type}: 创建新项目 (例如 /api/input/work)。
       * POST /api/update/{type}: 更新现有项目 (例如 /api/update/work)。
       * POST /api/delete/{type}: 删除项目 (例如 /api/delete/work)。

   * 文件服务 (File Serving)
       * 文件服务已迁移至 `assets.vocarchive.com`

# 管理和测试接口

  这些主要在 poc.html (Proof of Concept) 和管理后台的危险区域中被调用。

   * 数据库管理 (Database)
       * POST /api/input/dbinit (或 GET /api/dbinit): 初始化数据库表。
       * POST /api/delete/dbclear (或 GET /api/dbclear): 清空数据库中的用户数据表。

# 外部API

   * GET https://assets.vocarchive.com/{file_id}: 从对象存储下载文件。
