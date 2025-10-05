// 预定义选项组配置
// Predefined Option Groups for Form Fields

// 通用布尔选项
export const booleanOptions = [
  { value: 'true', text: 'Yes' },
  { value: 'false', text: 'No' }
];

export const booleanOptionsZh = [
  { value: 'true', text: '是' },
  { value: 'false', text: '否' }
];

// 创作者类型选项
export const creatorTypeOptions = [
  { value: 'human', text: 'Human' },
  { value: 'virtual', text: 'Virtual' }
];

// 版权基础选项
export const copyrightBasisOptions = [
  { value: 'none', text: '未知/不明' },
  { value: 'license', text: '按许可证授权' },
  { value: 'accept', text: '已获授权' },
  { value: 'onlymetadata', text: '仅元数据 (文件引用自外部源)' },
  { value: 'arr', text: '版权保留 (如侵权请联系删除)' }
];

// 关系类型选项
export const relationTypeOptions = [
  { value: 'original', text: 'original' },
  { value: 'remix', text: 'remix' },
  { value: 'cover', text: 'cover' },
  { value: 'remake', text: 'remake' },
  { value: 'picture', text: 'picture' },
  { value: 'lyrics', text: 'lyrics' }
];

// 存储类型选项
export const storageTypeOptions = [
  { value: 'raw_url', text: '直接 URL' },
  { value: 'ipfs', text: 'IPFS' }
];

// 资产类型选项
export const assetTypeOptions = [
  { value: 'lyrics', text: '歌词' },
  { value: 'picture', text: '图片' }
];

// 页脚项目类型选项
export const footerItemTypeOptions = [
  { value: 'link', text: 'Link' },
  { value: 'social', text: 'Social' },
  { value: 'copyright', text: 'Copyright' }
];

// 系统配置键选项
export const configKeyOptions = [
  { value: 'site_title', text: '网站标题 (site_title)' },
  { value: 'home_title', text: '主页标题 (home_title)' },
  { value: 'player_title', text: '播放器页标题 (player_title)' },
  { value: 'admin_title', text: '管理后台标题 (admin_title)' },
  { value: 'tags_categories_title', text: '标签分类页标题 (tags_categories_title)' },
  { value: 'migration_title', text: '迁移页面标题 (migration_title)' },
  { value: 'totp_secret', text: 'TOTP 密钥 (totp_secret)' },
  { value: 'jwt_secret', text: 'JWT 密钥 (jwt_secret)' },
  { value: 'db_version', text: '数据库版本 (db_version)' },
  { value: 'ipfs_gateways', text: 'IPFS 网关列表 (ipfs_gateways)' }
];

// 所有选项组的映射
export const optionGroups = {
  booleanOptions,
  booleanOptionsZh,
  creatorTypeOptions,
  copyrightBasisOptions,
  relationTypeOptions,
  storageTypeOptions,
  assetTypeOptions,
  footerItemTypeOptions,
  configKeyOptions
};

// 工具函数：根据选项组名称获取选项
export function getOptionGroup(groupName) {
  return optionGroups[groupName] || [];
}

// 工具函数：检查选项组是否存在
export function isValidOptionGroup(groupName) {
  return groupName in optionGroups;
}