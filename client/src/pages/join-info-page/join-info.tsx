import {
  View,
  Form,
  Input,
  Button,
  Image,
  Picker,
  Canvas
} from "@tarojs/components";
import { NavBar } from "taro-navigationbar";
import { useEffect, useState, memo, useDidShow } from "@tarojs/taro";

import Avatar from "@/components/Avatar";
import { USERSTORAGE, JOININFO } from "@/constants/storage";
import { checkJoinForm } from "@/utils/checkform";
import {
  showToast,
  cropAvatar,
  getFileName,
  showSecurityModal
} from "@/utils/utils";
import { AtModal } from "taro-ui";

import defaulAvatar from "../../assets/default_avatar.png";
import selectArrow from "../../assets/icon_select_arrow.png";

import "./join-info.scss";
import {
  CANCEL_SELECT,
  LOADING,
  EXPECTION,
  SAVE_SUCCESS,
  UPDATE_SUCCESS,
  CHECK_CONTENT
} from "@/constants/toast";
import { PRIMARY_COLOR } from "@/constants/theme";
import {
  WHEREOPTION,
  PLACEOPTION,
  CROP_AVATAR_CANVAS_ID,
  GLOBAL_KEY_CROP_AVATAR_IMAGE,
  AD_HIDDEN
} from "@/constants/data";
import { set, get } from "@/utils/globaldata";
import { checkContentSecurity } from "@/utils/callcloudfunction";
import AuthModal from "@/components/AuthModal";

enum ActionType {
  Add,
  Update
}
let avatarName = "";
let geo;
let addressClickCount = 0;
let avatarUploadName = "";
function JoinClass() {
  const [goWhereIdx, setGoWhereIdx] = useState(0);
  const [addressSelect, setAddressSelect] = useState("");
  const [avatar, setAvatar] = useState(defaulAvatar);
  const [formAction, setFormAction] = useState(ActionType.Add);
  const [updateValue, setUpdateValue] = useState({});
  const [canvasWidth, setCanvasWidth] = useState(100);
  const [isOpened, setIsOpened] = useState(false);
  const [isauth, setIsauth] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const goWhereChange = e => {
    setGoWhereIdx(e);
  };
  const openChooseAddress = async () => {
    if (addressClickCount) {
      const settings = await Taro.getSetting();
      if (!settings.authSetting["scope.userLocation"]) {
        Taro.showModal({
          title: "提示",
          content: "您需要重新授权地理位置信息",
          confirmText: "去授权",
          confirmColor: PRIMARY_COLOR,
          success: res => {
            if (res.confirm) {
              Taro.openSetting();
            }
          }
        });
        return;
      }
    }
    addressClickCount++;
    try {
      const location = await Taro.chooseLocation({});
      let { address, longitude, latitude } = location;
      const randomAppendix = Number(Number(Math.random() / 200).toFixed(6));
      const randomPlus = Math.floor(Math.random() * 2);
      if (randomPlus) {
        longitude += randomAppendix;
        latitude += randomAppendix;
      } else {
        longitude = String(Number(longitude) - randomAppendix);
        latitude = String(Number(latitude) - randomAppendix);
      }
      geo = { longitude, latitude };
      setAddressSelect(address);
    } catch (error) {
      console.log(error);
      showToast(CANCEL_SELECT);
    }
  };
  //先触发敏感信息授权
  // useEffect(()=>{
  // },[isOpened])
  const authInformation = () => {
    if (isauth) {
      return;
    }
    setIsOpened(true);
  };
  const handleClose = () => {
    setIsOpened(false);
  };
  const handleCancel = () => {
    setIsOpened(false);
  };
  const handleConfirm = () => {
    setIsOpened(false);
    setIsauth(true);
    Taro.showToast({
      title: "授权成功",
      icon: "success",
      duration: 2000
    });
    // set('empowered',true)
  };
  // 表单提交
  const onJoinSubmit = async e => {
    if (!isauth) {
      setIsOpened(true);
      return;
    }
    const formData = e.detail.value;
    let avatarUrl = avatar;
    let locationAvatar =
      "cloud://urge-plf5k.7572-urge-plf5k-1303880983/point.png";
    // 如果有输入值不合法，返回
    if (!checkJoinForm({ ...formData, addressSelect })) {
      return;
    }
    console.log(formData);
    try {
      Taro.showLoading({ title: CHECK_CONTENT });
      const check_content_res = await checkContentSecurity(
        `${formData["name"]}${formData["place"]}`
      );

      if (check_content_res && check_content_res["code"] == 300) {
        Taro.hideLoading();
        showSecurityModal("内容");
        return;
      }
      // TODO: 压缩图片
      // 上传头像
      // 先上传图片，如果用户选择了自己的头像，则需要上传，否则使用用户的微信头像
      Taro.showLoading({ title: LOADING });
      switch (formAction) {
        case ActionType.Add:
          console.log(get(GLOBAL_KEY_CROP_AVATAR_IMAGE), "1");
          const addFileName = getFileName();
          const { fileID } = await Taro.cloud.uploadFile({
            cloudPath: `avatar/${addFileName}.png`,
            filePath: get(GLOBAL_KEY_CROP_AVATAR_IMAGE) // 文件路径
          });
          console.log(fileID, "fileID");
          locationAvatar = fileID;
          // 调用加入云函数，将用户信息插入班级表，将班级信息插入到用户集合
          const { result } = await Taro.cloud.callFunction({
            name: "info",
            data: {
              $url: "add",
              info: {
                ...formData,
                avatarUrl,
                address: addressSelect,
                location: geo,
                state: goWhereIdx,
                locationAvatar,
                avatarName: addFileName
              }
            }
          });
          if (result && result["data"]) {
            Taro.hideLoading();
            Taro.setStorageSync(JOININFO, result["data"]);
            // 返回页面
            Taro.showToast({
              title: SAVE_SUCCESS,
              icon: "success",
              duration: 2000
            });
            set("isInfo", true);
            setTimeout(() => {
              Taro.navigateBack();
            }, 2000);
          }
          break;
        case ActionType.Update:
          const { fileID: updateFileID } = await Taro.cloud.uploadFile({
            cloudPath: `avatar/${avatarUploadName}.png`,
            filePath: get(GLOBAL_KEY_CROP_AVATAR_IMAGE) // 文件路径
          });
          locationAvatar = updateFileID;
          const updateResult = await Taro.cloud.callFunction({
            name: "info",
            data: {
              $url: "update",
              info: {
                ...formData,
                avatarUrl,
                address: addressSelect,
                location: geo,
                state: goWhereIdx,
                locationAvatar,
                avatarName: avatarUploadName
              }
            }
          });
          console.log(updateResult);
          if (updateResult && updateResult["result"]) {
            Taro.showToast({ title: UPDATE_SUCCESS });
            // 返回页面
            setTimeout(() => {
              Taro.navigateBack();
            }, 1500);
          }
          break;
      }
    } catch (error) {
      console.log(error);
      showToast(EXPECTION);
    }
  };
  const fetchStorage = () => {
    const { avatarUrl } = Taro.getStorageSync(USERSTORAGE);
    // TODO: cropImage 裁剪图片
    cropAvatar(avatarUrl, canvasWidth, CROP_AVATAR_CANVAS_ID);
    setAvatar(avatarUrl);
  };

  // 查询用户信息
  const fetchInfo = async () => {
    try {
      Taro.showLoading({ title: LOADING });
      const { result } = await Taro.cloud.callFunction({
        name: "info",
        data: {
          $url: "get"
        }
      });
      console.log(result);
      if (result && result["data"].length > 0) {
        const data = result["data"][0];
        setFormAction(ActionType.Update);
        setUpdateValue(data);
        setAddressSelect(data["address"]);
        setGoWhereIdx(data["state"]);
        avatarUploadName =
          data["avatarName"] === "" ? getFileName() : data["avatarName"];
        // const infoStorage = Taro.getStorageSync(JOIN_INFO)

        // TODO: 设置缓存
      }
      Taro.hideLoading();
    } catch (error) {
      showToast(EXPECTION);
    }
  };
  interface actionRes {
    errMsg: string;
    tapIndex: number;
  }
  useEffect(() => {
    // 设置状态栏的颜色以及背景色
    // Taro.setNavigationBarColor({
    //   frontColor: '#ffffff',
    //   backgroundColor: '#ffffff',
    // })
    // 获取 windowsWidth
    if (!showAuthModal) {
      const systemInfo = Taro.getSystemInfoSync();
      const { windowWidth } = systemInfo;
      setCanvasWidth(windowWidth);
      fetchStorage();
      fetchInfo();
      setIsOpened(true);
    }
  }, [showAuthModal]);
  useDidShow(() => {
    if (!get("isAuth")) {
      setShowAuthModal(true);
    }
  });
  const showAction = () => {
    console.log(isOpened, "isopend");
    Taro.showActionSheet({
      itemList: WHEREOPTION,
      success: function(res: actionRes) {
        const { tapIndex } = res || {};
        goWhereChange(tapIndex);
      },
      fail: function(res) {
        console.log(res.errMsg);
      }
    });
  };
  return (
    <View className="join_page">
      {/* <NavBar
        title='完善信息'
        back
        iconTheme={'white'}
        background={'#A1C0FB'}
        color={'#FFFFFF'}
      /> */}
      <Canvas
        canvasId={CROP_AVATAR_CANVAS_ID}
        className="crop-canvas"
        style={{ width: `${canvasWidth}px`, height: `${canvasWidth}px` }}
      />
      <View className="form_bg">
        <Avatar image={avatar} radius={148} border={4} />
      </View>
      <Form onSubmit={onJoinSubmit} className="form_container">
        <View className="form_item">
          <View className="form_label">姓名：</View>
          <Input
            cursor-spacing={5}
            className="form_input"
            placeholder="输入您的姓名或昵称"
            placeholderClass="placeholder"
            name="name"
            value={formAction === ActionType.Update ? updateValue["name"] : ""}
          />
        </View>
        <View className="form_item" onClick={showAction}>
          <View className="form_label">去向：</View>
          <View>{WHEREOPTION[goWhereIdx]}</View>
        </View>
        <View className="form_item">
          <View className="form_label">{PLACEOPTION[goWhereIdx]}：</View>
          <Input
            cursor-spacing={5}
            className="form_input"
            placeholder={`输入${PLACEOPTION[goWhereIdx]}名称`}
            placeholderClass="placeholder"
            name="place"
            value={formAction === ActionType.Update ? updateValue["place"] : ""}
          />
        </View>
        <View className="form_item">
          <View className="form_label">电话：</View>
          <Input
            cursor-spacing={5}
            className="form_input"
            placeholder="输入您的电话"
            placeholderClass="placeholder"
            name="phone"
            type="number"
            value={formAction === ActionType.Update ? updateValue["phone"] : ""}
          />
        </View>
        <View onClick={openChooseAddress} className="form_item">
          <View className="form_label">地址：</View>
          {addressSelect.length === 0 ? (
            <View className="placeholder">选择一个地址</View>
          ) : (
            <View className="select_address">{addressSelect}</View>
          )}
          <Image className="select_arrow" src={selectArrow} />
        </View>
        <Button
          formType="submit"
          className="form_btn"
          hoverClass="form_btn_hover"
          onClick={authInformation}
        >
          保存信息
        </Button>
      </Form>
      <View className="notice">* 信息只能被同一班级的同学查看</View>
      <View className="custom_small_ad" hidden={get(AD_HIDDEN)}>
        {/*<ad-custom unit-id="adunit-906053a3e8508c69"></ad-custom>*/}
      </View>
      {showAuthModal ? (
        <AuthModal
          onClose={() => {
            setShowAuthModal(false);
          }}
        />
      ) : null}
      <AtModal
        isOpened={isOpened}
        title="隐私政策"
        cancelText="取消"
        confirmText="授权"
        onClose={handleClose}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        content="
        本软件尊重并保护所有使用服务用户的个人隐私权。为了给您提供更准确、更有个性化的服务，本软件会按照本隐私权政策的规定使用和披露您的个人信息。但本软件将以高度的勤勉、审慎义务对待这些信息。除本隐私权政策另有规定外，在未征得您事先许可的情况下，本软件不会将这些信息对外披露或向第三方提供。本软件会不时更新本隐私权政策。您在同意本软件服务使用协议之时，即视为您已经同意本隐私权政策全部内容。本隐私权政策属于本软件服务使用协议不可分割的一部分。

1.适用范围

a)在您注册本软件帐号时，您根据本软件要求提供的个人注册信息；

b)在您使用本软件网络服务，或访问本软件平台网页时，本软件自动接收并记录的您的浏览器和计算机上的信息，包括但不限于您的IP地址、浏览器的类型、使用的语言、访问日期和时间、软硬件特征信息及您需求的网页记录等数据；

c)本软件通过合法途径从商业伙伴处取得的用户个人数据。

您了解并同意，以下信息不适用本隐私权政策：

a)您在使用本软件平台提供的搜索服务时输入的关键字信息；

b)本软件收集到的您在本软件发布的有关信息数据，包括但不限于参与活动、成交信息及评价详情；

c)违反法律规定或违反本软件规则行为及本软件已对您采取的措施。

2.信息使用

a)本软件不会向任何无关第三方提供、出售、出租、分享或交易您的个人信息，除非事先得到您的许可，或该第三方和本软件（含本软件关联公司）单独或共同为您提供服务，且在该服务结束后，其将被禁止访问包括其以前能够访问的所有这些资料。

b)本软件亦不允许任何第三方以任何手段收集、编辑、出售或者无偿传播您的个人信息。任何本软件平台用户如从事上述活动，一经发现，本软件有权立即终止与该用户的服务协议。

c)为服务用户的目的，本软件可能通过使用您的个人信息，向您提供您感兴趣的信息，包括但不限于向您发出产品和服务信息，或者与本软件合作伙伴共享信息以便他们向您发送有关其产品和服务的信息（后者需要您的事先同意）。

3.信息披露

在如下情况下，本软件将依据您的个人意愿或法律的规定全部或部分的披露您的个人信息：

a)经您事先同意，向第三方披露；

b)为提供您所要求的产品和服务，而必须和第三方分享您的个人信息；

c)根据法律的有关规定，或者行政或司法机构的要求，向第三方或者行政、司法机构披露；

d)如您出现违反中国有关法律、法规或者本软件服务协议或相关规则的情况，需要向第三方披露；

e)如您是适格的知识产权投诉人并已提起投诉，应被投诉人要求，向被投诉人披露，以便双方处理可能的权利纠纷；

f)在本软件平台上创建的某一交易中，如交易任何一方履行或部分履行了交易义务并提出信息披露请求的，本软件有权决定向该用户提供其交易对方的联络方式等必要信息，以促成交易的完成或纠纷的解决。

g)其它本软件根据法律、法规或者网站政策认为合适的披露。

4.信息存储和交换

本软件收集的有关您的信息和资料将保存在本软件及（或）其关联公司的服务器上，这些信息和资料可能传送至您所在国家、地区或本软件收集信息和资料所在地的境外并在境外被访问、存储和展示。

5.Cookie的使用

a)在您未拒绝接受cookies的情况下，本软件会在您的计算机上设定或取用cookies，以便您能登录或使用依赖于cookies的本软件平台服务或功能。本软件使用cookies可为您提供更加周到的个性化服务，包括推广服务。

b)您有权选择接受或拒绝接受cookies。您可以通过修改浏览器设置的方式拒绝接受cookies。但如果您选择拒绝接受cookies，则您可能无法登录或使用依赖于cookies的本软件网络服务或功能。

c)通过本软件所设cookies所取得的有关信息，将适用本政策。

6.信息安全

a)本软件帐号均有安全保护功能，请妥善保管您的用户名及密码信息。本软件将通过对用户密码进行加密等安全措施确保您的信息不丢失，不被滥用和变造。尽管有前述安全措施，但同时也请您注意在信息网络上不存在“完善的安全措施”。

b)在使用本软件网络服务进行网上交易时，您不可避免的要向交易对方或潜在的交易对方披露自己的个人信息，如联络方式或者邮政地址。请您妥善保护自己的个人信息，仅在必要的情形下向他人提供。如您发现自己的个人信息泄密，尤其是本软件用户名及密码发生泄露，请您立即联络本软件客服，以便本软件采取相应措施。
        "
      />
    </View>
  );
}
JoinClass.config = {
  enablePullDownRefresh: true,
  enableShareTimeline: true,
  navigationBarTitleText: "我的信息"
};
export default memo(JoinClass);
