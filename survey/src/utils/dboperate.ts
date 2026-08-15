import { ElMessage, ElMessageBox } from 'element-plus'
// IndexedDB 仅作本地缓存（用于进编辑器秒开）
import { db } from '@/db/db'
// 类型
import type { SurveyDBData, SurveyDBReturnData } from '@/types'
import type { EditorStore } from '@/types'

// 服务端操作（保存/更新/删除）由 useSurvey 的 mutation 提供，
// 内部负责 invalidateQueries(['surveys']) 刷新首页列表缓存，这里只做 UI 编排 + 本地缓存

// 缓存到 IndexedDB（put 按主键 upsert，写入失败不影响主流程）
function cacheWrite(survey: SurveyDBReturnData) {
  return db.surveys.put(survey).catch(() => {})
}
function cacheDelete(id: number) {
  return db.surveys.delete(id).catch(() => {})
}

// 保存试卷
export function save(
  store: EditorStore,
  createSurvey: (data: SurveyDBData) => Promise<SurveyDBReturnData>
) {
  return new Promise<number>((resolve, reject) => {
    ElMessageBox.prompt('请输入问卷标题', '提示', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      type: 'info',
    })
      .then(({ value }) => {
        const surveyToSave = {
          createDate: new Date().getTime(),
          updateDate: new Date().getTime(),
          title: value,
          surveyCount: store.surveyCount,
          coms: JSON.parse(JSON.stringify(store.coms)),
        }
        createSurvey(surveyToSave)
          .then((res) => {
            // 同步本地缓存，保证进编辑器时可秒开
            cacheWrite({ ...surveyToSave, id: res.id, userId: res.userId })
            resolve(res.id)
            ElMessage({
              type: 'success',
              message: '已保存',
            })
          })
          .catch((e) => {
            reject(e)
            console.log('保存失败')
          })
      })
      .catch((e) => {
        console.log(e)
        console.log('取消保存')
      })
  })
}

// 更新试卷
export function update(
  store: EditorStore,
  id: number,
  updateSurvey: (id: number, data: Partial<SurveyDBData>) => Promise<void>
) {
  return new Promise<void>((resolve, reject) => {
    updateSurvey(id, {
      updateDate: new Date().getTime(),
      surveyCount: store.surveyCount,
      coms: JSON.parse(JSON.stringify(store.coms)),
    })
      .then(() => {
        // 同步本地缓存
        const survey = {
          updateDate: new Date().getTime(),
          surveyCount: store.surveyCount,
          coms: JSON.parse(JSON.stringify(store.coms)),
        }
        db.surveys
          .where('id')
          .equals(id)
          .modify(survey)
          .catch(() => {})
        resolve(void 0)
        ElMessage({
          type: 'success',
          message: '已保存',
        })
        store.setCurrentComponentIndex(-1)
      })
      .catch((e) => {
        reject(e)
        console.log('取消更新')
      })
  })
}

// 删除试卷
export function remove(id: number, deleteSurvey: (id: number) => Promise<void>) {
  return new Promise<void>((resolve, reject) => {
    ElMessageBox.confirm('确定删除该问卷吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        deleteSurvey(id)
          .then(() => {
            // 同步删除本地缓存
            cacheDelete(id)
            resolve(void 0)
            ElMessage.success('删除成功')
          })
          .catch((e) => {
            reject(e)
            console.log('删除失败')
          })
      })
      .catch(() => {
        console.log('取消删除')
      })
  })
}
