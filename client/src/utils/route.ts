import Taro from '@tarojs/taro'
import { gotoPage } from './common'

/** 搜索班级 */
const toSearchClass = () => {
  gotoPage('/pages/search-class/search-class')
}
/** 创建班级 */
const toCreateClass = (params) => {
  gotoPage('/pages/create-class/create-class', params)
}
/** 填写个人信息tab */
const toJoinInfo = () => {
  gotoPage('/pages/join-info/join-info', '', { method: 'switchTab' })
}
/** 填写个人信息page */
const toJoinInfoPage = () => {
  gotoPage('/pages/join-info-page/join-info')
}
export { toSearchClass, toCreateClass, toJoinInfo, toJoinInfoPage }