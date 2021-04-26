import Taro from '@tarojs/taro'
import { PRIMARY_COLOR } from '@/constants/theme'
import { CHARGE } from '@/constants/page'
import { set } from './globaldata'
import { GLOBAL_KEY_COMPRESS_CLASS_IMAGE, GLOBAL_KEY_CROP_AVATAR_IMAGE } from '@/constants/data'
import { JOININFO } from '@/constants/storage'
import avatarLocation from '../assets/icon_avatar_location.png'

const showToast = (title = '') => {
  Taro.showToast({ title, icon: 'none' })
}

const showModal = async (content: string, confirmColor: string = PRIMARY_COLOR, confirmText: string = '确认', title: string = '提示') => {
  try {
    const { confirm } = await Taro.showModal({
      title: title,
      content: content,
      confirmColor: confirmColor,
      confirmText: confirmText,
    })
    return confirm
  } catch (error) {
    console.log(error);
  }
}

const showLimitModal = (title, content, confirmText) => {
  Taro.showModal({
    title: title,
    content: content,
    confirmColor: PRIMARY_COLOR,
    confirmText: confirmText,
    success: (res) => {
      if (res.confirm) {
        Taro.navigateTo({ url: CHARGE })
      }
    }
  })
}

const showSecurityModal = (content: string) => {
  Taro.showModal({
    title: '警告',
    content: `禁止上传违法违规${content}，多次违规将冻结账号，请重新填写信息。`,
    showCancel: false,
    confirmColor: PRIMARY_COLOR,
    confirmText: '我知道了'
  })
}

const compressImage = async (path: string, drawWidth: number, canvasId: string) => {
  if (!path) return
  console.log(path, '111path')
  const info = await Taro.getImageInfo({
    src: path
  })
  console.log(info, 'info')
  const { width, height } = info
  const maxSide = Math.max(width, height)
  let scale = 1
  if (maxSide > drawWidth) {
    scale = drawWidth / maxSide;
  }
  const imageW = Math.floor(width * scale * 0.1);
  const imageH = Math.floor(height * scale * 0.1)
  const canvasCtx = Taro.createCanvasContext(canvasId)
  canvasCtx.drawImage(path, 0, 0, imageW, imageH)
  canvasCtx.draw(false, async () => {
    const { tempFilePath } = await Taro.canvasToTempFilePath({
      canvasId: canvasId,
      x: 0,
      y: 0,
      width: imageW,
      height: imageH,
      quality: 1,
    });
    set(GLOBAL_KEY_COMPRESS_CLASS_IMAGE, tempFilePath)
  })
}

const cropAvatar = async (imagePath: string, drawWidth: number, canvasId: string) => {
  console.log(imagePath, '222')
  const { path } = await getImageWH(imagePath, drawWidth)
  const { path: location_icon } = await getImageWH('cloud://urge-plf5k.7572-urge-plf5k-1303880983/point.png', drawWidth)
  // const minSide = Math.min(imageW, imageH)
  const diameter = 50;
  const canvasCtx = Taro.createCanvasContext(canvasId)
  const strokeWidth = 4
  canvasCtx.drawImage(location_icon, 0, 0)
  canvasCtx.save()
  canvasCtx.beginPath()
  canvasCtx.arc(diameter / 2 + 17, diameter / 2 + 10, diameter / 2 - strokeWidth, 0, 2 * Math.PI)//绘制圆形
  canvasCtx.setStrokeStyle('white')
  canvasCtx.setLineWidth(strokeWidth)
  canvasCtx.stroke()
  canvasCtx.clip()
  canvasCtx.drawImage(path, 17, 10, diameter, diameter)
  canvasCtx.restore()
  canvasCtx.draw(true, async () => {
    const { tempFilePath } = await Taro.canvasToTempFilePath({
      canvasId: canvasId,
      x: 0,
      y: 0,
      width: 84,
      height: 84,
      quality: 0.5,
    });
    console.log(tempFilePath, 'tempFilePath')
    set(GLOBAL_KEY_CROP_AVATAR_IMAGE, tempFilePath)
  })
}

// 获取图片宽高
const getImageWH = async (imagePath: string, drawWidth: number) => {
  console.log(imagePath, 'imagepath')
  const { width, height, path } = await Taro.getImageInfo({
    src: imagePath
  })
  console.log(path);

  const maxSide = Math.max(width, height)
  let scale = 1
  if (maxSide > drawWidth) {
    scale = drawWidth / maxSide;
  }
  const imageW = Math.floor(width * scale * 0.5)
  const imageH = Math.floor(height * scale * 0.5)
  return { imageH, imageW, path }
}

const getFileName = () => {
  return `${Date.now()}${getRandomNumber()}`
}

const getRandomNumber = (minNum = 100000, maxNum = 999999) => {
  return Math.floor(Math.random() * (maxNum - minNum + 1) + minNum)
}

const udpateDB = async () => {

}

/**判断是否授权 */
const isAuthorized = async () => {
  await Taro.getSetting({
    success: res => {
      console.log(res, '111')
      if (res.authSetting['scope.userInfo']) {
        console.log('授权')
        set('isAuth', true)
      } else {
        set('isAuth', false)
      }
    },
    fail: () => {
      set('isAuth', false)
    }
  })
}
/** 判断是否填写了个人信息 */
const fetchSavedInfo = async () => {
  const { result } = await Taro.cloud.callFunction({
    name: 'info',
    data: {
      $url: 'get'
    }
  })
  if (result && result['data'].length > 0) {
    const info = result['data'][0]
    Taro.setStorage({
      key: JOININFO,
      data: info
    })
    set('isInfo', true)
  }
}
const getLaunchOptions = () => {
  const launchOptions = Taro.getLaunchOptionsSync()
  console.log('launchOptions', launchOptions)
  return launchOptions || {}
}
export { showToast, showModal, showLimitModal, showSecurityModal, getFileName, compressImage, cropAvatar, isAuthorized, fetchSavedInfo,getLaunchOptions }