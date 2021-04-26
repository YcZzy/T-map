import Taro, { useState, useEffect, Events } from "@tarojs/taro";
import { Button, View } from "@tarojs/components";
import { expireDay, setSyncCache } from "@utils/cache";
import { reportSetFilterMsg } from "@utils/report";
import AuthDialog from "../Dialog/auth";
import { updateInfo } from "../../apis/base";
import {
  loginByWxBindMobile,
  loginByAuthWx,
  getToken
} from "../../plugins/passport";
import { globalData } from "../../utils/config";
import "./index.less";

const EventEmitter = new Events();
const EventName = "USER_INFO_EVENT";
export default function UserInfo({ api, handle, children }) {
  UserInfo.externalClasses = ["define-class"];
  const [isUserInfoBtn, setIsUserInfoBtn] = useState(!globalData.loginLock);
  const [isUserInfo, setIsUserInfo] = useState(false);
  const [isPhoneBind, setIsPhoneBind] = useState(false);
  useEffect(() => {
    const eventHandle = userInfoFlag => {
      setIsUserInfoBtn(userInfoFlag);
    };
    EventEmitter.on(EventName, eventHandle);
    return () => {
      EventEmitter.off(EventName, eventHandle);
    };
  }, []);

  // ppu过期
  const setPpuCache = () => {
    console.log("setPPU");
    globalData.ppuLock = true;
    globalData.loginLock = true;
    setSyncCache("CACHE_BL_PPU", "PPU_SUCCESS", expireDay(6));
  };

  const apiHandle = async type => {
    if (!api) {
      if (isUserInfoBtn !== false) {
        EventEmitter.trigger(EventName, false);
      }
      setPpuCache();
      return handle && handle({ hasAuth: !isUserInfoBtn });
    }
    const { code, data, msg = "" } = (await api()) || {};
    if (code === undefined) {
      return;
    }
    // 重新授权获取ppu
    if ([1001, 1002, 1003, 1006].includes(code)) {
      Taro.showToast({
        title: "网络开小差了，请您再试一下~",
        icon: "none",
        duration: 2000
      });
      reportSetFilterMsg("passport-overdue");
      // 重新授权
      if (isUserInfoBtn !== true) {
        globalData.loginLock = false;
        globalData.ppuLock = false;
        EventEmitter.trigger(EventName, true);
      }
      setIsUserInfoBtn(true);
    } else {
      if (isUserInfoBtn !== false) {
        EventEmitter.trigger(EventName, false);
      }

      // 授权成功
      if (type === "phoneAuth" || type === "wxAuth") {
        globalData.loginLock = true;
        setPpuCache();
      }

      handle &&
        handle({
          data,
          msg,
          code,
          hasAuth: !isUserInfoBtn
        });
    }
  };
  const loginAuthWx = async (detail, type = "opentype") => {
    try {
      // check session_key是否过期, 当前启动时期最多更新用户一次
      if (api && !globalData.updaaInfo) {
        globalData.updaaInfo = true;
        Taro.checkSession({
          success() {
            updateInfo(detail);
          },
          fail() {
            getToken(true).then(() => {
              updateInfo(detail);
            });
          }
        });
      }
      const ppu = await loginByAuthWx(detail);
      if (ppu) {
        globalData.ppu = ppu;
        apiHandle("wxAuth");
      }
    } catch (e) {
      // 账号未绑定手机
      if (type === "opentype" && typeof e === "object" && e.code === "-106") {
        setIsPhoneBind(true);
      }
    }
  };
  const loginByAuthWxFn = e => {
    const { encryptedData, iv } = (e && e.detail) || {};
    if (!encryptedData || !iv) {
      // 用户拒绝授权
      setIsUserInfo(true);
      return;
    }
    loginAuthWx(e.detail);
  };

  // 用户信息dialog弹窗
  const userCompleteHanle = (type, e) => {
    if (type === "cancel") {
      setIsUserInfo(false);
      return;
    }
    if (e) {
      const { encryptedData, iv } = (e && e.detail) || {};
      if (encryptedData && iv) {
        loginAuthWx(e.detail);
        setIsUserInfo(false);
      }
    }
  };

  // 手机号绑定dialog弹窗
  const phoneCompleteFn = async (type, e) => {
    if (type === "cancel") {
      setIsPhoneBind(false);
      return;
    }
    const { encryptedData, iv } = (e && e.detail) || {};
    if (!encryptedData || !iv) {
      return;
    }

    // 绑定接口
    const ppu = await loginByWxBindMobile(e.detail);
    if (ppu) {
      globalData.ppu = ppu;
      apiHandle("phoneAuth");
    }
    setIsPhoneBind(false);
  };
  return !isUserInfoBtn ? (
    <View className="define-class" onClick={apiHandle}>
      {children}
    </View>
  ) : (
    <View className="define-class">
      {children}
      <Button
        className="userinfo-btn"
        open-type="getUserInfo"
        onGetUserInfo={loginByAuthWxFn}
      ></Button>
      {isUserInfo && (
        <AuthDialog
          complete={userCompleteHanle}
          content="操作需用您的用户信息授权"
        />
      )}
      {isPhoneBind && (
        <AuthDialog
          type="phoneAuth"
          complete={phoneCompleteFn}
          content="该微信无绑定账号，请授权手机号登录，登录成功后微信將自动绑定至该账号"
        />
      )}
    </View>
  );
}
