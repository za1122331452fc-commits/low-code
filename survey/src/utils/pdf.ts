// utils/pdf.ts —— 问卷生成本地 PDF
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * 将问卷导出为本地 PDF（A4 纵向）
 *
 * 性能策略：整个答题卡只截图一次，再按每道题的坐标从大图上裁出切片逐题排版，
 * 避免"每题一次 html2canvas"导致的 O(N) 次整页截图（题目多时很慢）。
 * 每题作为一个整体，放不下时换页，避免题目被截断。
 *
 * @param container 包含所有题目的容器（截图对象，需与 blocks 同坐标系）
 * @param blocks 题目块元素数组（必须是 container 内的后代，顺序排版）
 * @param filename 文件名（不含扩展名）
 */
export async function exportSurveyToPdf(
  container: HTMLElement,
  blocks: HTMLElement[],
  filename: string
) {
  if (!container || !blocks.length) return

  // 整体截图一次（2 倍率保证清晰度）
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const pxScale = canvas.width / container.offsetWidth // DOM 像素 -> 画布像素
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth() // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight() // 297mm
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  const imgWidth = contentWidth
  const mmPerPx = imgWidth / canvas.width // 画布像素 -> mm
  let y = margin

  for (let i = 0; i < blocks.length; i++) {
    const { top, height } = getBlockOffset(blocks[i], container)
    const sliceHeightPx = Math.max(1, Math.round(height * pxScale))
    const imgHeight = sliceHeightPx * mmPerPx

    // 从大图上裁出当前题目
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = sliceHeightPx
    const ctx = slice.getContext('2d')
    if (ctx) {
      ctx.drawImage(
        canvas,
        0,
        top * pxScale,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      )
    }

    // 剩余空间放不下当前题目时换页（题目整体不拆分）
    if (i > 0 && y + imgHeight > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }

    pdf.addImage(slice, 'JPEG', margin, y, imgWidth, imgHeight)
    y += imgHeight + 8
  }

  pdf.save(`${filename}.pdf`)
}

// 计算元素相对容器的左上角偏移（沿 offsetParent 链累加）
function getBlockOffset(el: HTMLElement, container: HTMLElement) {
  let top = 0
  let node: HTMLElement | null = el
  while (node && node !== container) {
    top += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { top, height: el.offsetHeight }
}
