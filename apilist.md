
# 核心数据接口

   * 认证 (Auth)
       * POST /api/auth/login: 用户登录。
       * POST /api/auth/reset-secrets: 重置认证密钥。

   * 数据查询 (Read)
       * GET /api/list/{type}: 获取指定类型的数据列表 (例如 /api/list/works)。
       * GET /api/get/{type}/{uuid}: 按UUID获取单个项目的详细信息 (例如 /api/get/work/{uuid})。
       * GET /api/get/file/{uuid}: 获取文件重定向到下载URL，支持media_source和asset的UUID (返回302重定向)。
       * GET /api/search/{query}: 根据关键词搜索歌曲 (例如 /api/search/{query})。
            * 仅匹配标题字段(支持多语言)
       * GET /api/list/tags: 获取所有标签列表。
       * GET /api/list/categories: 获取分类树形结构。
       * GET /api/list/works-by-tag/{tag_uuid}/{page}/{size?}: 按标签获取作品列表（带分页）。
       * GET /api/list/works-by-category/{category_uuid}/{page}/{size?}: 按分类获取作品列表（带分页）。

   * 数据修改 (Write)
       * POST /api/input/{type}: 创建新项目 (例如 /api/input/work, /api/input/tag, /api/input/category)。
       * POST /api/update/{type}: 更新现有项目 (例如 /api/update/work, /api/update/tag, /api/update/category)。
       * POST /api/delete/{type}: 删除项目 (例如 /api/delete/work, /api/delete/tag, /api/delete/category)。
       * POST /api/input/work-tags: 批量添加作品标签。
       * POST /api/input/work-categories: 批量添加作品分类。
       * POST /api/delete/work-tags: 批量删除作品标签。
       * POST /api/delete/work-categories: 批量删除作品分类。
       
# 管理和测试接口

  这些主要在 poc.html (Proof of Concept) 和管理后台的危险区域中被调用。

   * 数据库管理 (Database)
       * POST /api/input/dbinit (或 GET /api/dbinit): 初始化数据库表。
       * POST /api/delete/dbclear (或 GET /api/dbclear): 清空数据库中的用户数据表。

# 外部API

   * GET https://assets.vocarchive.com/{file_id}: 从对象存储下载文件 (Legacy/仅供Demo使用)。
    <!-- 文件服务用的B2 套了CF 某些人别打了 看见个新项目就急 什么b素质 -->

# 标签与分类系统

   * **系统特性**
       * 标签 (Tags): 扁平结构，用于灵活标记 (例如: "rock", "ballad", "duet")
       * 分类 (Categories): 层级结构，用于系统分类 (例如: "原创歌曲" > "摇滚" > "另类摇滚")
       * 多重分配: 每个作品可以拥有多个标签和分类
       * 搜索集成: 支持按标签或分类筛选作品，带分页功能

   * **数据结构**
       * tag: 简单的名称标签
       * category: 支持父子关系的层级组织
       * work_tag: 作品与标签的多对多关系
       * work_category: 作品与分类的多对多关系

   * **API 集成**
       * 所有作品查询都在响应中包含关联的标签和分类
       * 提供专门的标签/分类管理和作品筛选端点
       * 支持批量操作以高效分配标签/分类