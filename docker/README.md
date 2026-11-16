# Docker 自动化部署

当前自动化部署借助 Docker 进行部署，前提是目标服务器部署了 `start_server` 服务。

## 目录结构

```
docker/
├── Dockerfile                          # Docker 镜像构建文件
├── build.sh                            # 统一构建和推送脚本（Jenkins 使用，兼容 /bin/sh）
├── shanshu-efficiency-frontend-dev.sh  # 开发环境服务器端部署脚本（需部署到目标服务器，兼容 /bin/sh）
├── shanshu-efficiency-frontend-test.sh # 测试环境服务器端部署脚本（需部署到目标服务器，兼容 /bin/sh）
├── shanshu-efficiency-frontend-prod.sh # 生产环境服务器端部署脚本（需部署到目标服务器，兼容 /bin/sh）
└── README.md                           # 说明文档
```

## 部署流程

1. **代码获取与构建**：Jenkins 获取 git 仓库代码并进行打包编译
2. **Docker 镜像构建**：将编译后的 `dist` 目录打包到 Docker 镜像中
3. **镜像推送**：将构建的镜像推送到私有仓库（`10.0.20.191:5001`）
4. **远程调度**：通过 HTTP 请求触发目标服务器的 `start_server` 服务
5. **自动部署**：`start_server` 服务执行对应环境的部署脚本（`shanshu-efficiency-frontend-{env}.sh`），拉取镜像并部署到指定目录

> **注意**：各环境的部署脚本需要预先部署到目标服务器的 `/home/shell-scripts` 目录下

## 使用方法

### Jenkins 配置

在 Jenkins 的构建步骤中配置 Shell 命令：

```bash
# 开发环境
sh docker/build.sh dev

# 测试环境
sh docker/build.sh test

# 生产环境
sh docker/build.sh prod
```

### 环境配置说明

| 环境 | 构建命令     | 镜像仓库路径                                    | 调度服务地址                                                                              |
| ---- | ------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| dev  | `build:dev`  | `10.0.20.191:5001/dev/org-efficiency-platform`  | `http://10.0.20.189:8889/start_server?server_name=shanshu-efficiency-frontend-dev.sh`     |
| test | `build:test` | `10.0.20.191:5001/test/org-efficiency-platform` | `http://10.0.20.98:9103/start_server?server_name=shanshu-efficiency-frontend-test.sh`     |
| prod | `build:prod` | `10.0.20.191:5001/prod/org-efficiency-platform` | `http://192.168.118.32:8889/start_server?server_name=shanshu-efficiency-frontend-prod.sh` |

### 构建脚本功能

统一构建脚本 `build.sh` 会自动完成以下操作：

1. **环境校验**：使用 `case` 语句验证环境参数（dev/test/prod），兼容 `/bin/sh`
2. **依赖安装**：全局安装 pnpm，并安装项目依赖
3. **项目构建**：根据环境执行对应的构建命令（`build:dev`/`build:test`/`build:prod`）
4. **Docker 构建**：将 Dockerfile 移动到项目根目录，构建 Docker 镜像
5. **镜像推送**：推送镜像到私有仓库（使用日期作为版本标签，格式：`YYYYMMDD`）
6. **远程调度**：通过 HTTP 请求触发目标服务器的部署服务，调用对应环境的部署脚本

**脚本兼容性**：`build.sh` 使用 POSIX 兼容语法（`case` 语句、普通变量），可在 `/bin/sh` 环境下正常运行。

### 服务器端部署脚本

各环境的部署脚本（`shanshu-efficiency-frontend-{env}.sh`）需要部署到目标服务器的 `/home/shell-scripts` 目录下，脚本功能包括：

1. **拉取镜像**：从私有仓库拉取对应环境的 Docker 镜像
2. **提取文件**：从容器中提取构建产物到临时目录
3. **部署更新**：删除旧版本，将新版本移动到部署目录

**部署目录**：

- 开发/测试环境：`/app/web/org-efficiency-platform`
- 生产环境：`/app/web/org-efficiency-platform`

**环境配置**：每个脚本文件对应一个环境，脚本中的 `ENV` 变量已预设：

- 开发环境：`shanshu-efficiency-frontend-dev.sh`（`ENV="dev"`）
- 测试环境：`shanshu-efficiency-frontend-test.sh`（`ENV="test"`）
- 生产环境：`shanshu-efficiency-frontend-prod.sh`（`ENV="prod"`）

**脚本兼容性**：所有部署脚本使用 POSIX 兼容语法，可在 `/bin/sh` 环境下正常运行。

## 服务器端脚本部署

### 部署步骤

1. **复制脚本到目标服务器**：

    ```bash
    # 将对应环境的部署脚本复制到目标服务器的 /home/shell-scripts 目录
    # 开发环境
    scp docker/shanshu-efficiency-frontend-dev.sh user@target-server:/home/shell-scripts/

    # 测试环境
    scp docker/shanshu-efficiency-frontend-test.sh user@target-server:/home/shell-scripts/

    # 生产环境
    scp docker/shanshu-efficiency-frontend-prod.sh user@target-server:/home/shell-scripts/
    ```

2. **设置执行权限**：

    ```bash
    # 开发环境
    chmod +x /home/shell-scripts/shanshu-efficiency-frontend-dev.sh

    # 测试环境
    chmod +x /home/shell-scripts/shanshu-efficiency-frontend-test.sh

    # 生产环境
    chmod +x /home/shell-scripts/shanshu-efficiency-frontend-prod.sh
    ```

3. **验证环境配置**：
   每个脚本文件已预设对应的环境变量，无需修改。如需确认，可查看脚本顶部的 `ENV` 变量：
    ```bash
    # 查看开发环境脚本配置
    head -n 10 /home/shell-scripts/shanshu-efficiency-frontend-dev.sh
    ```

### 脚本说明

各环境的部署脚本执行流程：

1. 从私有仓库拉取对应环境的 Docker 镜像（镜像标签为当前日期）
2. 创建临时容器，将容器内的 `/app/dockerTmp` 目录内容复制到宿主机挂载目录
3. 删除旧的部署目录
4. 将临时目录重命名为正式部署目录

**重要提示**：

- 脚本中的 `ENV` 变量必须与构建时使用的环境一致
- 确保目标服务器已安装 Docker 并配置了私有仓库访问权限
- 确保部署目录（`/app/web`）存在且有写权限
- 不同环境的脚本使用不同的镜像仓库地址和部署目录，请根据实际情况配置

## 故障排查

### 常见问题

1. **镜像拉取失败**
    - 检查私有仓库地址是否正确
    - 确认服务器可以访问私有仓库（`10.0.20.191:5001`）
    - 检查镜像标签是否正确（使用日期格式：`YYYYMMDD`）

2. **文件复制失败**
    - 检查挂载目录是否存在（开发/测试环境：`/home/billboard-project`，生产环境：`/home/frontend-packages`）
    - 确认部署目录 `/app/web` 是否存在且有写权限
    - 检查磁盘空间是否充足

3. **远程调度失败**
    - 检查 `start_server` 服务是否正常运行
    - 确认调度服务地址是否正确
    - 查看服务日志排查问题

### 手动部署

如果自动部署失败，可以手动在目标服务器上执行：

```bash
# 切换到脚本目录
cd /home/shell-scripts

# 执行对应环境的部署脚本
# 开发环境
./shanshu-efficiency-frontend-dev.sh

# 测试环境
./shanshu-efficiency-frontend-test.sh

# 生产环境
./shanshu-efficiency-frontend-prod.sh
```
