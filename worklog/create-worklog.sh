#!/bin/bash

# 工作日誌自動生成腳本
# 用途：自動建立包含正確日期的工作日誌檔案

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 取得當前日期和時間
CURRENT_DATE=$(date '+%Y-%m-%d')
CURRENT_DATE_COMPACT=$(date '+%Y%m%d')
CURRENT_TIME=$(date '+%H:%M:%S')
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "未提交")

# 參數處理
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "使用方式："
    echo "  ./create-worklog.sh [主題]"
    echo ""
    echo "範例："
    echo "  ./create-worklog.sh                    # 建立今日通用日誌"
    echo "  ./create-worklog.sh jaeger_integration # 建立特定主題日誌"
    exit 0
fi

# 設定主題
TOPIC=${1:-"daily"}
TOPIC_FORMATTED=$(echo $TOPIC | tr '[:upper:]' '[:lower:]' | tr ' ' '_')

# 檔案路徑
WORKLOG_DIR="$(dirname "$0")"
TEMPLATE_FILE="$WORKLOG_DIR/template.md"
OUTPUT_FILE="$WORKLOG_DIR/${CURRENT_DATE_COMPACT}_${TOPIC_FORMATTED}.md"

# 檢查模板是否存在
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}錯誤：找不到模板檔案 $TEMPLATE_FILE${NC}"
    exit 1
fi

# 檢查輸出檔案是否已存在
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}警告：檔案已存在 $OUTPUT_FILE${NC}"
    read -p "是否要覆蓋？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消操作"
        exit 0
    fi
fi

# 建立工作日誌
echo -e "${GREEN}建立工作日誌...${NC}"
echo "📅 日期: $CURRENT_DATE"
echo "🕒 時間: $CURRENT_TIME"
echo "🌿 分支: $CURRENT_BRANCH"
echo "📝 主題: $TOPIC"

# 複製模板並替換變數
cp "$TEMPLATE_FILE" "$OUTPUT_FILE"

# 使用 sed 替換模板變數（相容 macOS 和 Linux）
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/{{DATE}}/${CURRENT_DATE}/g" "$OUTPUT_FILE"
    sed -i '' "s/{{BRANCH}}/${CURRENT_BRANCH}/g" "$OUTPUT_FILE"
    sed -i '' "s/{{COMMIT}}/${CURRENT_COMMIT}/g" "$OUTPUT_FILE"
    sed -i '' "s/\[主題名稱\]/${TOPIC}/g" "$OUTPUT_FILE"
else
    # Linux
    sed -i "s/{{DATE}}/${CURRENT_DATE}/g" "$OUTPUT_FILE"
    sed -i "s/{{BRANCH}}/${CURRENT_BRANCH}/g" "$OUTPUT_FILE"
    sed -i "s/{{COMMIT}}/${CURRENT_COMMIT}/g" "$OUTPUT_FILE"
    sed -i "s/\[主題名稱\]/${TOPIC}/g" "$OUTPUT_FILE"
fi

echo -e "${GREEN}✅ 工作日誌已建立：$OUTPUT_FILE${NC}"

# 提供編輯選項
read -p "是否要立即編輯？(Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # 偵測可用的編輯器
    if command -v code &> /dev/null; then
        code "$OUTPUT_FILE"
    elif command -v vim &> /dev/null; then
        vim "$OUTPUT_FILE"
    elif command -v nano &> /dev/null; then
        nano "$OUTPUT_FILE"
    else
        echo -e "${YELLOW}找不到編輯器，請手動開啟檔案${NC}"
    fi
fi

echo ""
echo "💡 提示："
echo "  • 檔案位置: $OUTPUT_FILE"
echo "  • 記得在工作結束時更新內容"
echo "  • 使用 git add $OUTPUT_FILE 加入版本控制"