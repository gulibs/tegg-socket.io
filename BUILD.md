# 插件打包指南

## 打包流程

这个插件使用 `tshy` 进行构建，支持 ESM 和 CommonJS 双模块格式。

### 1. 构建插件

```bash
npm run prepublishOnly
```

这个命令会执行：
- `tshy` - 将 TypeScript 源代码编译为 ESM 和 CommonJS 格式
- `tshy-after` - 后处理步骤（如果有配置）
- `attw --pack` - 验证包的类型定义

### 2. 构建后的目录结构

构建完成后，会生成 `dist/` 目录：

```
dist/
├── esm/              # ESM 格式输出
│   ├── index.js
│   ├── index.d.ts
│   └── ...其他文件
└── commonjs/         # CommonJS 格式输出
    ├── index.js
    ├── index.d.ts
    └── ...其他文件
```

### 3. 手动构建步骤

如果您只想构建而不发布：

```bash
# 清理之前的构建
npm run clean

# 构建
tshy
tshy-after
attw --pack
```

或者直接运行：

```bash
npm run prepublishOnly
```

### 4. 验证构建结果

```bash
# 检查 dist 目录
ls -la dist/

# 检查 ESM 输出
ls -la dist/esm/

# 检查 CommonJS 输出
ls -la dist/commonjs/
```

## 发布到 npm

### 1. 准备发布

确保：
- ✅ 所有测试通过：`npm test`
- ✅ 代码已构建：`npm run prepublishOnly`
- ✅ 版本号已更新：编辑 `package.json` 中的 `version` 字段

### 2. 发布到 npm

```bash
# 发布到 npm（会自动运行 prepublishOnly）
npm publish
```

注意：
- `prepublishOnly` 会在发布前自动运行，构建插件
- 发布后会自动清理 `dist/` 目录（如果配置了 `postpublish`）

### 3. 发布到特定 registry

```bash
# 发布到 npm
npm publish --registry=https://registry.npmjs.org/

# 或使用配置的 registry
npm publish
```

## 构建配置说明

### package.json 配置

```json
{
  "files": ["dist", "src"],      // 发布时包含的文件
  "main": "./dist/commonjs/index.js",     // CommonJS 入口
  "module": "./dist/esm/index.js",        // ESM 入口
  "types": "./dist/commonjs/index.d.ts",  // TypeScript 类型定义
  "exports": {
    ".": {
      "import": {
        "types": "./dist/esm/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/commonjs/index.d.ts",
        "default": "./dist/commonjs/index.js"
      }
    }
  }
}
```

### tshy 配置

```json
{
  "tshy": {
    "exports": {
      ".": "./src/index.ts",
      "./package.json": "./package.json"
    }
  }
}
```

## 本地测试构建结果

### 1. 构建插件

```bash
npm run prepublishOnly
```

### 2. 在本地项目中测试

```bash
# 方式 1: 使用 npm link
cd /path/to/your/app
npm link /path/to/tegg-socket.io

# 方式 2: 使用本地路径
# 在应用的 package.json 中：
{
  "dependencies": {
    "@gulibs/tegg-socket.io": "file:../tegg-socket.io"
  }
}
```

### 3. 打包为 tarball（用于测试）

```bash
# 构建
npm run prepublishOnly

# 创建 tarball
npm pack

# 这会在当前目录生成一个 .tgz 文件
# 例如：gulibs-tegg-socket.io-0.0.1.tgz
```

然后可以在其他项目中安装：

```bash
npm install /path/to/gulibs-tegg-socket.io-0.0.1.tgz
```

## 常见问题

### Q: 构建失败怎么办？

A: 检查：
1. TypeScript 编译错误：`npm run lint`
2. 类型定义问题：`attw --pack`
3. tshy 配置是否正确

### Q: 发布后 dist 目录被清理了？

A: 这是正常的。`postci` 脚本会在测试覆盖率完成后清理 `dist/` 目录。

如果需要保留构建结果，可以：

```bash
# 只运行构建，不清理
tshy && tshy-after && attw --pack
```

### Q: 如何只构建 ESM 或 CommonJS？

A: `tshy` 默认会构建两种格式。如果需要只构建一种，需要修改 `tshy` 配置。

## 版本管理

### 更新版本号

```bash
# 手动编辑 package.json
# 或使用 npm version

# 补丁版本（0.0.1 -> 0.0.2）
npm version patch

# 次要版本（0.0.1 -> 0.1.0）
npm version minor

# 主要版本（0.0.1 -> 1.0.0）
npm version major
```

### 发布前检查清单

- [ ] 代码已提交到 Git
- [ ] 所有测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新（如果有）
- [ ] README 文档已更新
- [ ] 构建成功（`npm run prepublishOnly`）
- [ ] 类型定义正确（`attw --pack` 无错误）
