import { View, Image, Button, Text } from "@tarojs/components";
import { NavBar } from "taro-navigationbar";
import {
  useState,
  useDidShow,
  memo,
  useEffect,
  useShareAppMessage,
  usePageScroll,
  useShareTimeline
} from "@tarojs/taro";

import Tag from "@/components/Tag";
import Avatar from "@/components/Avatar";

import { JOIN_INFO, CLASS_MAP, CLASS_DETAIL } from "@/constants/page";
import { LOADING, EXPECTION, JOIN_SUCCESS } from "@/constants/toast";
import {
  CLASSSTORAGE,
  JOININFO,
  JOINUSERS,
  USERSTORAGE,
  CLASS_SHARE_TOOLTIP_STORAGE,
  LIMITSTORAGE
} from "@/constants/storage";

import empty from "../../assets/illustration_empty.png";
import imagePlaceholder from "../../assets/image_placeholder.png";

import "./class-detail.scss";
import AuthModal from "@/components/AuthModal";
import TokenModal from "@/components/TokenModal";
import { showToast, showLimitModal, getLaunchOptions } from "@/utils/utils";
import { isClassFull, getLevel } from "@/utils/callcloudfunction";
import Tooltip from "@/components/Tooltip";
import { get } from "@/utils/globaldata";
import { AD_HIDDEN } from "@/constants/data";
import { toJoinInfoPage } from "@/utils/route";
interface IClassDetailProps {
  className: string;
  creator: string;
  joinUsers: [];
  classImage: string;
  count: number;
}

let isInfoSaved = false;
let token;
let classId;
let classImage;
let classCreator;
function ClassDetail() {
  const defaultProps: IClassDetailProps = {
    classImage: imagePlaceholder,
    creator: "",
    joinUsers: [],
    className: "",
    count: 0
  };
  const [classState, setClassState] = useState<IClassDetailProps>(defaultProps);
  const [isJoin, setIsJoin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [joinUsers, setJoinUsers] = useState([]);
  const [navOpacity, setNavOpacity] = useState(0);
  const [navIconTheme, setNavIconTheme] = useState("white");
  const [showTooltip, setShowTooltip] = useState(false);
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);

  const bindBtnClick = () => {
    // ????????????????????????
    if (!isAuth) {
      setShowAuthModal(true);
      return;
    }
    console.log(isInfoSaved);

    // ???????????????????????????
    if (!isInfoSaved) {
      // Taro.navigateTo({ url: JOIN_INFO })
      toJoinInfoPage();
      return;
    }

    // ????????????????????????
    if (!isJoin) {
      setShowTokenModal(true);
      return;
    }

    // TODO: ?????????????????????
    Taro.navigateTo({ url: CLASS_MAP });
  };
  const fetchDetail = async (_id: string) => {
    try {
      Taro.showLoading({ title: LOADING });
      // ????????????????????????
      const { result } = await Taro.cloud.callFunction({
        name: "detail",
        data: {
          _id
        }
      });
      if (result) {
        setClassState(result["classData"]);
        setIsJoin(result["isJoin"]);
        setJoinUsers(result["infoData"]);
        // ??????????????????
        Taro.setStorage({ key: CLASSSTORAGE, data: result["classData"] });
        // ???????????????????????????
        Taro.setStorage({ key: JOINUSERS, data: result["infoData"] });
        token = result["classData"]["token"];
        classImage = result["classData"]["classImage"];
        classCreator = result["classData"]["creator"];
        setLoaded(true);
      }
      Taro.hideLoading();
    } catch (e) {
      Taro.hideLoading();
      Taro.showToast({ title: EXPECTION, icon: "none" });
    }
  };

  const fetchSavedInfo = async () => {
    const { result } = await Taro.cloud.callFunction({
      name: "info",
      data: {
        $url: "get"
      }
    });
    if (result && result["data"].length > 0) {
      const info = result["data"][0];
      Taro.setStorage({
        key: JOININFO,
        data: info
      });
      isInfoSaved = true;
    }
  };

  const checkToken = async e => {
    console.log(e);
    const value = e.detail.value["token"];
    if (value !== token) {
      showToast("????????????");
      return;
    }

    // TODO: ????????????????????????????????????
    try {
      Taro.showLoading({ title: LOADING });
      // ????????????????????????
      const fullData = await isClassFull(classId);
      console.log("isFull", fullData);
      if (fullData && fullData["isFull"] == true) {
        showToast("??????????????????");
        setShowTokenModal(false);
        return;
      }

      // ?????? infoId
      const info = Taro.getStorageSync(JOININFO);
      // ??????????????????
      const { result } = await Taro.cloud.callFunction({
        name: "join",
        data: {
          infoId: info["_id"],
          classId: classId
        }
      });
      console.log(result);
      if (result && result["code"] == 500) {
        showLimitModal(
          "??????",
          "??????????????????????????????????????? pro ??????????????????????????????",
          "????????????"
        );
        setShowTokenModal(false);
        Taro.hideLoading();
        return;
      }
      if (
        result &&
        result["code"] == 200 &&
        result["data"]["classRes"]["stats"]["updated"]
      ) {
        setShowTokenModal(false);
        await fetchDetail(classId);
        Taro.showToast({ title: JOIN_SUCCESS });
        setTimeout(() => {
          // ????????????
          Taro.navigateTo({ url: CLASS_MAP });
        }, 2000);
      }
    } catch (error) {
      console.log(error);
      showToast(EXPECTION);
    }
  };

  const onAuthSuccess = () => {
    if (!isInfoSaved) {
      setTimeout(() => {
        Taro.navigateTo({ url: JOIN_INFO });
      }, 1500);
    }
  };

  const handleTooltip = async () => {
    // ????????????????????? Tooltip ?????????
    try {
      await Taro.getStorage({
        key: CLASS_SHARE_TOOLTIP_STORAGE,
        success: res => {
          setShowTooltip(res.data);
        },
        fail: () => {
          Taro.setStorageSync(CLASS_SHARE_TOOLTIP_STORAGE, true);
          setShowTooltip(true);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  const closeTooltip = () => {
    setShowTooltip(false);
    // ????????????w???false
    Taro.setStorage({
      key: CLASS_SHARE_TOOLTIP_STORAGE,
      data: false
    });
  };

  // usePageScroll(res => {
  //   const { scrollTop } = res
  //   if (scrollTop < 20 && scrollTop >= 0) {
  //     Taro.setNavigationBarColor({
  //       frontColor: '#ffffff',
  //       backgroundColor: '#ffffff',
  //     })
  //     setNavIconTheme('white')
  //     setNavOpacity(0)
  //     return
  //   } else if (scrollTop >= 20 && scrollTop < 40) {
  //     Taro.setNavigationBarColor({
  //       frontColor: '#000000',
  //       backgroundColor: '#000000',
  //     })
  //     setNavIconTheme('dark')
  //     setNavOpacity(0.2)
  //   } else if (scrollTop >= 40 && scrollTop < 60) {
  //     setNavOpacity(0.4)
  //   } else if (scrollTop >= 60 && scrollTop < 80) {
  //     setNavOpacity(0.6)
  //   } else if (scrollTop >= 80 && scrollTop < 100) {
  //     setNavOpacity(0.8)
  //   } else if (scrollTop > 100 && scrollTop <= 120) {
  //     setNavOpacity(1)
  //   }
  // })

  useEffect(() => {
    // ???????????????????????????????????????
    // Taro.setNavigationBarColor({
    //   frontColor: '#ffffff',
    //   backgroundColor: '#ffffff',
    // })
    const systemInfo = Taro.getSystemInfoSync();
    const { statusBarHeight } = systemInfo;
    const isiOS = systemInfo.system.indexOf("iOS") > -1;
    let navHeight = 0;
    if (isiOS) {
      navHeight = 0;
    } else {
      navHeight = 4;
    }
    setStatusBarHeight(statusBarHeight - 15);
    setNavHeight(navHeight);
    let { _id } = this.$router.params;
    if (!_id) {
      _id = JSON.stringify(this.$router.params)
        .split(":")[1]
        .split("}")[0]
        .split('"')[1];
    }
    classId = _id;
    fetchDetail(_id);
    handleTooltip();
  }, []);

  useDidShow(() => {
    // ????????????????????? infoId????????????????????????????????????????????????
    const info = Taro.getStorageSync(JOININFO);
    const { scene } = getLaunchOptions();
    if (!info || scene === 1155) {
      fetchSavedInfo();
      return;
    }
    isInfoSaved = true;
  });

  useEffect(() => {
    // ??????????????????
    Taro.getSetting({
      success: res => {
        if (res.authSetting["scope.userInfo"]) {
          setIsAuth(true);
          // ????????????????????????????????? getUserInfo ?????????????????????????????????
        }
      }
    });
  }, [showAuthModal]);

  useShareAppMessage(() => {
    console.log(classId, classImage);
    let shareName;
    // ??????????????????
    const userInfo = Taro.getStorageSync(USERSTORAGE);
    if (!userInfo) {
      shareName = classCreator;
    } else {
      shareName = userInfo["nickName"];
    }
    return {
      title: `${shareName}???????????????${classState.className}?????????????????????????????????????????????~`,
      path: `${CLASS_DETAIL}?_id=${classId}`,
      imageUrl: classImage
    };
  });
  useShareTimeline(() => {
    let shareName;
    // ??????????????????
    const userInfo = Taro.getStorageSync(USERSTORAGE);
    if (!userInfo) {
      shareName = classCreator;
    } else {
      shareName = userInfo["nickName"];
    }
    return {
      title: `${shareName}???????????????${classState.className}????????????????????????~`,
      query: `${CLASS_DETAIL}?_id=${classId}`,
      imageUrl: classImage
    };
  });
  const avatarDom = joinUsers.map(item => {
    return (
      <View className="avatar_item">
        <Avatar image={item["avatarUrl"]} radius={80} border={0} />
      </View>
    );
  });

  return (
    <View className="page_detail">
      {showTooltip ? (
        <Tooltip
          content={"??????????????????????????????"}
          top={statusBarHeight + navHeight}
          onClose={closeTooltip}
        />
      ) : null}
      <View className="navbar">
        {/* <NavBar
          home
          back
          iconTheme={navIconTheme}
          background={`rgba(255,255,255,${navOpacity})`}
          onHome={() => {
            Taro.redirectTo({ url: '/pages/index/index' });
          }} /> */}
      </View>
      {showAuthModal ? (
        <AuthModal
          onClose={() => {
            setShowAuthModal(false);
          }}
          onSuccess={onAuthSuccess}
        />
      ) : null}
      {showTokenModal ? (
        <TokenModal
          onClose={() => {
            setShowTokenModal(false);
          }}
          onCheck={checkToken}
        />
      ) : null}

      <View className="header">
        <Image
          mode="aspectFill"
          className="head-img"
          src={classState.classImage}
        />
        <View className="mask"></View>
      </View>
      <View className="detail_container">
        <View className="classname_container">
          <View className="classname">{classState.className}</View>
          {isJoin ? (
            <Tag label={"?????????"} />
          ) : (
            <Tag label={"?????????"} bgColor={"#ffe7ba"} labelColor={"#fa8c16"} />
          )}
        </View>
        <View className="class_info">
          <View className="info_item">????????????{classState.creator}</View>
          <View className="info_item">????????????{classState.count}???</View>
          <View className="info_item">
            ????????????{classState.joinUsers.length}???
          </View>
        </View>
        {loaded &&
          (classState.joinUsers.length === 0 ? (
            <View className="empty_container">
              <Image className="image" src={empty} />
              <View className="empty_hint">
                <Text>??????????????????????????????????????????~</Text>
              </View>
            </View>
          ) : (
            <View className="avatars">{avatarDom}</View>
          ))}
        <View className="action_btn_container">
          <Button
            hoverClass="btn_hover"
            className="action_btn"
            onClick={bindBtnClick}
          >
            {isJoin ? "????????????????????????" : "????????????"}
          </Button>
        </View>
      </View>
      <View className="custom_small_ad" hidden={get(AD_HIDDEN)}>
        {/*<ad-custom unit-id="adunit-1ea99652e18ed037"></ad-custom>*/}
      </View>
    </View>
  );
}
ClassDetail.config = {
  enableShareTimeline: true,
  navigationBarTitleText: "????????????"
};
export default memo(ClassDetail);
