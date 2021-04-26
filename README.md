# 🧭 聚聊聊


「聚聊聊」小程序是一款设计精美、体验优良的地图信息展示小程序，一个更有意思的同学录。可以在小程序中查看班级同学的去向以及地域分布。



## 开发

技术栈：

- Taro
- TypeScript
- SCSS
- 云开发


### 安装依赖

小程序使用 [Taro v2.2.9](https://taro-docs.jd.com/taro/docs/README) 框架，利用小程序云开发存储数据以及前后台交互。

```bash
# 进入 client 安装项目依赖
$ cd client
$ yarn install
```

### 运行项目

使用 Taro 全局命令启动项目，编译好后直接使用小程序开发者工具打开即可预览调试。

```bash
# 调试模式
$ taro build --type weapp --watch
# 编译构建
$ taro build --type weapp
```

