## 当前 脚本需要放到目标服务器 /home/shell-scripts下 不同环境需要切换不同的环境配置

# 日志输出统一格式
info() { echo "ℹ️  $1"; }
ok() { echo "✅ $1"; }
error() { echo "❌ $1"; }

# 公共变量定义
ENV="test"                             # 当前环境：dev/test/prod，需按环境调整
APP_NAME="org-efficiency-platform"    # 项目名称
REGISTRY="10.0.20.191:5001"           # 私有镜像仓库地址
BASE_DIR="/home/billboard-project"    # 宿主机部署根目录
OUTPUT_DIR="/output"                  # 容器内挂载目录（映射到 BASE_DIR）
IMAGE_TAG="$(date +%Y%m%d)"           # 镜像标签：当天日期
IMAGE_PATH="${REGISTRY}/${ENV}/${APP_NAME}:${IMAGE_TAG}" # 完整镜像路径
TEMP_DIR="${BASE_DIR}/${APP_NAME}Tmp" # 宿主机临时解压目录
TARGET_DIR="${BASE_DIR}/${APP_NAME}"  # 宿主机最终部署目录

# 若临时目录存在则删除
info "清理临时目录: ${TEMP_DIR}"
rm -rf "${TEMP_DIR}"

# 拉取镜像
info "拉取镜像: ${IMAGE_PATH}"
docker pull "${IMAGE_PATH}" || { error "镜像拉取失败！"; exit 1; }

# 提取容器中内容
info "解压构建产物到宿主机: ${TEMP_DIR}"
docker run --rm --name "${APP_NAME}-tmp" \
  -v "${BASE_DIR}:${OUTPUT_DIR}" \
  "${IMAGE_PATH}" \
  sh -c "cp -r /app/dockerTmp ${OUTPUT_DIR}/${APP_NAME}Tmp"

# 检查 Docker 命令是否成功执行
if [ $? -ne 0 ]; then
  error "Docker 命令执行失败！"
  exit 1
fi

# 删除旧目录并重命名
info "替换部署目录: /app/web/${APP_NAME}"
rm -rf "/app/web/${APP_NAME}"
mv "/app/web/${APP_NAME}Tmp" "/app/web/${APP_NAME}"

# 检查 mv 命令是否成功执行
if [ $? -ne 0 ]; then
  error "移动文件失败！"
  exit 1
fi

ok "部署完成：/app/web/${APP_NAME}"
