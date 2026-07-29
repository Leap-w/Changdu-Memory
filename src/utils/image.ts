/**
 * 前端图片压缩工具
 * 使用 Canvas API，不引入额外依赖
 */

const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const JPEG_QUALITY = 0.8

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return '仅支持 JPG、PNG、WebP 格式'
  }
  if (file.size > MAX_SIZE) {
    return `图片不能超过 ${MAX_SIZE / 1024 / 1024}MB`
  }
  return null
}

/**
 * 压缩图片。
 * - 超过尺寸限制时等比缩放
 * - 转 JPEG 以减小体积
 * - 保持 EXIF 方向（简化：依赖浏览器自动处理）
 */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 小图片直接返回
    if (file.size < 200 * 1024 && file.type !== 'image/png') {
      resolve(file)
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // 等比缩放
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob)
          } else {
            // 压缩效果不大，用原图
            resolve(file)
          }
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}
