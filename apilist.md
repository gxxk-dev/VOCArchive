
# 核心数据接口

   * 认证 (Auth)
       * POST /api/auth/login: 用户登录。
       * POST /api/auth/reset-secrets: 重置认证密钥。

   * 数据查询 (Read)
       * GET /api/list/{type}: 获取指定类型的数据列表 (例如 /api/list/works)。
       * GET /api/get/{type}: 按UUID获取单个项目的详细信息 (例如 /api/get/work?uuid=...)。
       * GET /api/get/file/{uuid}: 获取文件重定向到下载URL，支持media_source和asset的UUID (返回302重定向)。
       * GET /api/search: 根据关键词搜索歌曲 (例如 /api/search/...)。
            * 仅匹配标题字段(支持多语言)
        * GET /api/get/file/{uuid}: 统一文件访问端点，返回302重定向到实际下载URL。

   * 数据修改 (Write)
       * POST /api/input/{type}: 创建新项目 (例如 /api/input/work)。
       * POST /api/update/{type}: 更新现有项目 (例如 /api/update/work)。
       * POST /api/delete/{type}: 删除项目 (例如 /api/delete/work)。
       
# 管理和测试接口

  这些主要在 poc.html (Proof of Concept) 和管理后台的危险区域中被调用。

   * 数据库管理 (Database)
       * POST /api/input/dbinit (或 GET /api/dbinit): 初始化数据库表。
       * POST /api/delete/dbclear (或 GET /api/dbclear): 清空数据库中的用户数据表。

# 外部API

   * GET https://assets.vocarchive.com/{file_id}: 从对象存储下载文件 (Legacy/仅供Demo使用)。
    <!-- 文件服务用的B2 套了CF 某些人别打了 看见个新项目就急 什么b素质 -->