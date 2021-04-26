import Taro, { Component, Config, showLoading } from "@tarojs/taro";
import { isAuthorized } from "@/utils/utils";
import Index from "./pages/index";
import { set as setGlobalData, get as getGlobalData } from "@/utils/globaldata";

import "./app.scss";
import {
  GLOBAL_KEY_PAYSUCCESS,
  GLOBAL_KEY_RESULTCODE,
  GLOBAL_KEY_MSG,
  GLOBAL_KEY_PAYJSORDERID,
  AD_HIDDEN
} from "./constants/data";
import { LOADING } from "./constants/toast";
import { getLevel } from "./utils/callcloudfunction";
import { LIMITSTORAGE } from "./constants/storage";

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends Component {
  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    pages: [
      "pages/index/index",
      "pages/charge/charge",
      "pages/create-class/create-class",
      "pages/search-class/search-class",
      "pages/class-detail/class-detail",
      "pages/join-info/join-info",
      "pages/class-map/class-map",
      "pages/create-class/create-success/create-success",
      "pages/create-class/create-attention/create-attention",
      "pages/class-manage/class-manage",
      "pages/join-info-page/join-info"
    ],
    window: {
      backgroundTextStyle: "light",
      navigationBarBackgroundColor: "#fff",
      navigationBarTitleText: "同学圈",
      navigationBarTextStyle: "black"
      // navigationStyle: 'custom'
    },
    tabBar: {
      color: "#cfcfcf",
      selectedColor: "#000",
      list: [
        {
          pagePath: "pages/index/index",
          text: "发现",
          iconPath: "./assets/index.png",
          selectedIconPath: "./assets/index.png"
        },
        {
          pagePath: "pages/class-manage/class-manage",
          text: "管理",
          iconPath: "./assets/manage.png",
          selectedIconPath: "./assets/manage.png"
        },
        {
          pagePath: "pages/join-info/join-info",
          text: "我",
          iconPath: "./assets/us.png",
          selectedIconPath: "./assets/us.png"
        }
      ]
    },
    plugins: {
      routePlan: {
        version: "1.0.11",
        provider: "wx50b5593e81dd937a"
      }
    },
    cloud: true,
    permission: {
      "scope.userLocation": {
        desc: "你的位置信息将用于在地图中展示"
      }
    }
    // navigateToMiniProgramAppIdList: [
    //   "wx7c9fd1f62d390a7a"
    // ]
  };

  componentDidMount() {
    isAuthorized();
    if (process.env.TARO_ENV === "weapp") {
      Taro.cloud.init({
        env: "urge-plf5k"
        // env: "test-3g0zqtd0f8fa0d92"
      });
    }
  }

  // async componentDidShow () {
  //   const { scene, referrerInfo } = this.$router.params
  //   console.log(scene, referrerInfo);

  //   if ( referrerInfo && referrerInfo['appId'] === 'wx959c8c1fb2d877b5') {
  //     // 还应判断请求路径
  //     let extraData = referrerInfo['extraData']
  //     setGlobalData(GLOBAL_KEY_PAYSUCCESS, extraData['success'])
  //     setGlobalData(GLOBAL_KEY_RESULTCODE, extraData['resultCode'])
  //     setGlobalData(GLOBAL_KEY_MSG, extraData['msg'])
  //     setGlobalData(GLOBAL_KEY_PAYJSORDERID, extraData['payjsOrderId'])
  //   }

  //   // 获取用户等级
  //   await this.fetchLimitInfo()
  // }

  componentDidHide() {}

  componentDidCatchError() {}

  // async fetchLimitInfo () {
  //   showLoading({ title: LOADING })
  //   try {
  //     const limitInfo = await getLevel()
  //     console.log(limitInfo,'000')
  //     if (limitInfo && limitInfo['level']) {
  //       console.log('111')
  //       Taro.setStorageSync(
  //         LIMITSTORAGE,
  //         limitInfo['limitData']
  //       )
  //       console.log(limitInfo);

  //       setGlobalData(AD_HIDDEN, limitInfo['level'] !== 'normal')
  //     }
  //     Taro.hideLoading()
  //   } catch (error) {
  //     Taro.hideLoading()
  //   }
  // }

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render() {
    return <Index />;
  }
}

Taro.render(<App />, document.getElementById("app"));
