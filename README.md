# VOCArch1ve

一个基于 Cloudflare Workers 和 D1 数据库的 泛VOCALOID 歌曲存档项目。

## ✨ 功能

-   歌曲信息的录入、删除、修改和搜索
-   基于TOTP的用户认证
-   提供歌曲列表和播放器页面

## 🚀 快速开始

> 此项目依托于 Cloudflare Workers/D1 因此您需要Cloudflare账户才能进行部署/开发

### 1. 初始化项目

点击下方按钮 跟随指引完成部署即可

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/gxxk-dev/VOCArchive.git)

(命名随意 合法即可)

### 2. 初始化数据库

在 部署时一同创建的数据库内 执行`initdb.sql`文件即可

### 3. 配置鉴权key

配置`TOTP_SECRET`/`JWT_SECRET`即可
key内容合法/保证安全性即可 

## 📝 API

API 列表请参考 [apilist.md](apilist.md)。

## 📄 许可证

本项目使用 [AGPL v3(or-later)](LICENSE) 许可证。
