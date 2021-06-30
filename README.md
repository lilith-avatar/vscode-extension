# Boom! Party for VS Code 

[![](https://img.shields.io/badge/-DaVinci-MediumPurple)](http://api.projectdavinci.com/)
[![](https://img.shields.io/badge/-Ava-ff69b4)](https://github.com/lilith-avatar/avatar-ava)
[![](https://img.shields.io/github/v/release/lilith-avatar/vscode-extension)](https://github.com/lilith-avatar/vscode-extension/releases)

达芬奇计划，VS Code 插件开发版



## 在线安装
本插件可以在微软Vscode插件商店中搜索`Boom! Party`进行安装

## 开发及本地调试
1. 将本仓库Clone到本地
``` shell
$ git clone https://github.com/lilith-avatar/vscode-extension.git
```
2. 在项目根目录执行以下命令
``` shell
$ npm i
$ code .
```
3. 点击`F5`进行调试

## 功能
- [x] 树状图
- [x] 代码格式化
- [x] 用户片段
- [ ] 静态检查
- [ ] 定义跳转
- [ ] 代码补全
- [ ] excel转lua

### 树状图

根据工作区打开的文件夹生成对应节点层级的树状图，并显示跟编辑器内一样的脚本文件节点名

![](./resources/snapshot/BoomTree.png)

### 代码格式化
![](./resources/snapshot/format.gif)

### 用户片段
除了常见的lua用户片段以外，还支持ava客户端和服务器端代码模板生成（通过输入`smod`或者`cmod`）
![](./resources/snapshot/userSnippets.gif)


