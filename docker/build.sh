# 统一构建和推送脚本
# 使用方法: sh docker/build.sh [dev|test|prod]
# 示例: sh docker/build.sh dev

set -e

# 日志输出统一格式
info() { echo "ℹ️  $1"; }
ok() { echo "✅ $1"; }
error() { echo "❌ $1"; }

# 项目名称
APP_NAME="org-efficiency-platform"

# 构建环境（dev/test/prod），默认 dev
ENV=${1:-dev}
case "$ENV" in
  dev|test|prod)
    ;;
  *)
    error "环境参数必须是 dev、test 或 prod"
    info "使用方法: sh docker/build.sh [dev|test|prod]"
    exit 1
    ;;
esac

info "开始构建 ${ENV} 环境..."

# 根据环境获取配置
case "$ENV" in
  dev)
    BUILD_CMD="build:dev"
    IMAGE_PATH="10.0.20.191:5001/dev/${APP_NAME}"
    DEPLOY_URL="http://10.0.20.189:8889/start_server?server_name=shanshu-efficiency-frontend-dev.sh"
    ;;
  test)
    BUILD_CMD="build:test"
    IMAGE_PATH="10.0.20.191:5001/test/${APP_NAME}"
    DEPLOY_URL="http://10.0.20.98:9103/start_server?server_name=shanshu-efficiency-frontend-test.sh"
    ;;
  prod)
    BUILD_CMD="build:prod"
    IMAGE_PATH="10.0.20.191:5001/prod/${APP_NAME}"
    DEPLOY_URL="http://192.168.118.32:8889/start_server?server_name=shanshu-efficiency-frontend-prod.sh"
    ;;
esac

# 安装 pnpm
info "开始安装 pnpm..."
npm i pnpm@10.6.4 -g
ok "pnpm 全局安装完成"

# 安装依赖
info "开始安装依赖..."
pnpm install
ok "依赖安装完成"

# 构建项目
info "开始构建 ${ENV} 环境..."

# 开发环境启用 OpenTelemetry 监控和组件性能监控
if [ "$ENV" = "dev" ]; then
  info "开发环境: 启用 OpenTelemetry 监控"
  export VITE_ENABLE_OTEL=false
  info "开发环境: 启用 React 组件渲染性能监控"
  export VITE_ENABLE_PROFILER=false
fi

pnpm ${BUILD_CMD}
ok "${ENV} 环境构建完成"

# 复制 Dockerfile
info "复制 Dockerfile..."
mv docker/Dockerfile .
ok "Dockerfile 复制完成"

# 生成镜像标签（使用日期作为版本号）
IMAGE_TAG="${IMAGE_PATH}:$(date +%Y%m%d)"
info "镜像标签: ${IMAGE_TAG}"

# 构建 Docker 镜像
info "开始构建 Docker 镜像..."
docker build -t "$IMAGE_TAG" .
ok "Docker 镜像构建完成: ${IMAGE_TAG}"

# 推送镜像到私有仓库
info "开始推送镜像到私有仓库..."
docker push "$IMAGE_TAG"
ok "Docker 镜像推送完成"

# 调度远程服务进行部署
info "开始调度远程部署服务..."
curl "${DEPLOY_URL}"
ok "远程部署调度完成"

ok "🎉 ${ENV} 环境构建和部署流程全部完成！"
