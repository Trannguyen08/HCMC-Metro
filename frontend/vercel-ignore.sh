#!/bin/bash

# ==============================================================================
# HCMC Metro - Vercel Ignore Script
# Script này được Vercel gọi mỗi khi có Commit mới đẩy lên Branch production
# Nếu không có code nào của thư mục Frontend bị thay đổi (tức user đang sửa backend)
# Script này sẽ cancel tiến trình build để tiết kiệm Usage Credits.
# ==============================================================================

echo "Kiểm tra thay đổi dành riêng cho Frontend..."
echo "Branch hiện tại: $VERCEL_GIT_COMMIT_REF"

# Git diff kiểm tra code kể từ HEAD trước so với Head hiện tại ở đúng folder "Curent" 
# Do thiết lập "Root Directory" của Vercel trên web sẽ là `frontend` nên lệnh này coi ./ là frontend/
git diff --quiet HEAD^ HEAD ./

# Result value mapping: 0 có nghĩa là không có thay đổi (sạch). 1 là có sự sai khác code
HAS_CHANGES=$?

if [ "$HAS_CHANGES" -eq 1 ]; then
  # exit code 1 trong script này sẽ báo cho Vercel RẰNG: 
  # Lệnh "Ignore" là SAI -> Tức là KHÔNG Ignore -> CỨ BUILD ĐI
  echo "✅ Phát hiện code frontend thay đổi. Tiến hành kích hoạt build Next.js..."
  exit 1
else
  # exit code 0 trong script này báo cho Vercel RẰNG:
  # Lệnh "Ignore" là ĐÚNG -> Tức là BỎ QUA -> Cancel Build !!
  echo "🛑 Commit hiện tại chỉ chứa code Backend! Không build lại Frontend nhằm tránh lãng phí tiền!"
  exit 0
fi
