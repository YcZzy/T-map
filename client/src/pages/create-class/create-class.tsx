import {
  useState,
  memo,
  useEffect,
  showLoading,
  hideLoading,
  useDidShow
} from "@tarojs/taro";
import {
  View,
  Image,
  Input,
  Form,
  Button,
  Text,
  Canvas,
  Icon
} from "@tarojs/components";
import { AtSwitch } from "taro-ui";
import { NavBar } from "taro-navigationbar";

import "./create-class.scss";
import illustrate from "../../assets/illustration_create_class_form.png";
import selectArrow from "../../assets/icon_select_arrow.png";
import {
  EXPECTION,
  CHECK_CONTENT,
  CHECK_IMAGE,
  CREATING,
  CREATE_SUCCESS,
  IMG_UPLOADING,
  LOADING,
  UPDATING
} from "@/constants/toast";
import { checkAddForm, checkUpdateForm } from "@/utils/checkform";
import { CREATE_ATTENTION, CREATE_SUCCESS_PAGE, INDEX } from "@/constants/page";
import { CREATE_TEMPLATE_MSG_ID } from "@/constants/template";
import { LIMITSTORAGE } from "@/constants/storage";
import { PRIMARY_COLOR } from "@/constants/theme";
import {
  checkContentSecurity,
  checkImageSecurity
} from "@/utils/callcloudfunction";
import {
  showSecurityModal,
  getFileName,
  compressImage,
  showToast
} from "@/utils/utils";
import { get } from "@/utils/globaldata";
import {
  GLOBAL_KEY_COMPRESS_CLASS_IMAGE,
  CLASS_CANVAS_ID,
  AD_HIDDEN,
  ActionType
} from "@/constants/data";
import { classDetail, updateClass } from "@/utils/request/manageClass";

let isChangeImage = false;
let minLimit = 1;
let classId;
function CreateClass() {
  const [imagePath, setImagePath] = useState("");
  const [imageName, setImageName] = useState("default");
  const [countLimit, setCountLimit] = useState(50);
  const [searchConfirm, setSearchConfirm] = useState(true);
  const [canvasWidth, setCanvasWidth] = useState(100);
  const [actionType, setActionType] = useState(ActionType.CREATE);
  const [updateInfo, setUpdateInfo] = useState({});
  const onCreateSubmit = async e => {
    await Taro.requestSubscribeMessage({
      tmplIds: [CREATE_TEMPLATE_MSG_ID],
      success: res => {
        console.log(res);
      }
    });
    const formData = e.detail.value;
    console.log(formData, "formData");
    try {
      // ????????????
      if (!(await checkAddForm({ ...formData, imagePath, countLimit }))) {
        return;
      }

      const { creator, className, count, token } = formData;

      // TODO: ??????????????????????????????
      Taro.showLoading({ title: CHECK_CONTENT });
      const check_content_res = await checkContentSecurity(
        `${creator}${className}`
      );
      if (check_content_res && check_content_res["code"] == 300) {
        Taro.hideLoading();
        showSecurityModal("??????");
        return;
      }
      Taro.showLoading({ title: CHECK_IMAGE });
      const check_image_res = await checkImageSecurity(
        get(GLOBAL_KEY_COMPRESS_CLASS_IMAGE)
      );
      console.log(check_image_res);

      if (!check_image_res) {
        return;
      }

      if (check_image_res && check_image_res["code"] == 300) {
        Taro.hideLoading();
        showSecurityModal("??????");
        return;
      }

      Taro.showLoading({ title: IMG_UPLOADING });

      // ???????????????
      const { fileID } = await Taro.cloud.uploadFile({
        cloudPath: `class-image/${imageName}`,
        filePath: imagePath // ????????????
      });

      Taro.showLoading({ title: CREATING });

      // ??????????????????????????????
      const { result } = await Taro.cloud.callFunction({
        name: "class",
        data: {
          $url: "create",
          createData: {
            creator,
            className,
            token,
            count: Number(count),
            classImage: fileID,
            createTime: Date.now(),
            canSearch: searchConfirm
          }
        }
      });
      Taro.hideLoading();
      if (result) {
        Taro.showToast({ title: CREATE_SUCCESS });
        Taro.redirectTo({
          url: `${CREATE_SUCCESS_PAGE}?creator=${creator}&className=${className}&token=${token}&_id=${result["data"]["_id"]}`
        });
        Taro.cloud.callFunction({
          name: "msg",
          data: {
            $url: "createMsg",
            classInfo: formData,
            classId: result["data"]["_id"]
          }
        });
      }
    } catch (e) {
      console.log(e);
      Taro.hideLoading();
      Taro.showToast({ title: EXPECTION, icon: "none" });
    }
  };
  const onUpdateSubmit = async e => {
    console.log("gengxin");
    const formData = e.detail.value;
    let file = imagePath;
    try {
      // ????????????
      if (!checkUpdateForm({ ...formData, imagePath, countLimit, minLimit })) {
        return;
      }
      const { creator, className, count } = formData;
      // TODO: ??????????????????????????????
      Taro.showLoading({ title: CHECK_CONTENT });
      const check_content_res = await checkContentSecurity(
        `${creator}${className}`
      );
      if (check_content_res && check_content_res["code"] == 300) {
        Taro.hideLoading();
        showSecurityModal("??????");
        return;
      }
      if (isChangeImage) {
        Taro.showLoading({ title: CHECK_IMAGE });
        const check_image_res = await checkImageSecurity(
          get(GLOBAL_KEY_COMPRESS_CLASS_IMAGE)
        );
        console.log(check_image_res);

        if (!check_image_res) {
          return;
        }

        if (check_image_res && check_image_res["code"] == 300) {
          Taro.hideLoading();
          showSecurityModal("??????");
          return;
        }
        Taro.showLoading({ title: IMG_UPLOADING });
        // ???????????????
        const { fileID } = await Taro.cloud.uploadFile({
          cloudPath: `class-image/${imageName}`,
          filePath: imagePath // ????????????
        });
        file = fileID;
      }
      Taro.showLoading({ title: UPDATING });
      const result = await updateClass(classId, {
        count,
        classImage: file,
        className,
        creator,
        canSearch: searchConfirm
      });
      if (result && result["resCode"] === 200) {
        Taro.showToast({ title: "???????????????" });
        setTimeout(() => {
          Taro.navigateBack();
        }, 2000);
      }
    } catch (e) {
      console.log(e);
      Taro.hideLoading();
      Taro.showToast({ title: EXPECTION, icon: "none" });
    }
  };
  const chooseImage = async () => {
    try {
      const image = await Taro.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album"]
      });
      const path = image.tempFilePaths[0];
      const format = path.split(".").pop();
      setImagePath(path);
      setImageName(`${getFileName()}.${format}`);
      isChangeImage = true;
      // ????????????
      await compressImage(path, canvasWidth, CLASS_CANVAS_ID);
    } catch (error) {
      Taro.showToast({ title: "????????????", icon: "none" });
    }
  };
  const onSearchConfirm = e => {
    setSearchConfirm(e);
  };
  const fetchClassInfo = async () => {
    try {
      Taro.showLoading({ title: LOADING });
      const result = await classDetail(classId);
      if (result && result["classData"]) {
        setUpdateInfo(result["classData"]);
        setImagePath(result["classData"]["classImage"]);
        setSearchConfirm(result["classData"]["canSearch"]);
        minLimit = result["classData"]["joinUsers"].length;
      }
      Taro.hideLoading();
    } catch (error) {
      Taro.hideLoading();
    }
  };
  useEffect(() => {
    // ?????? windowsWidth
    const systemInfo = Taro.getSystemInfoSync();
    const { windowWidth } = systemInfo;
    setCanvasWidth(windowWidth);
    const { _id, action } = this.$router.params;
    classId = _id;
    setActionType(Number(action));
    if (Number(action) === ActionType.UPDATE) {
      fetchClassInfo();
    }
  }, []);

  useDidShow(() => {
    // ??????????????????????????????
    const limitInfo = Taro.getStorageSync(LIMITSTORAGE);
    setCountLimit(limitInfo["countLimit"]);
  });

  return (
    <View className="create_page">
      <Canvas
        canvasId={CLASS_CANVAS_ID}
        className="press-canvas"
        style={{ width: `${canvasWidth}px`, height: `${canvasWidth}px` }}
      />
      {/* <NavBar title={actionType === ActionType.CREATE ? '????????????' : '????????????'} back /> */}
      <Image className="image" src={illustrate} />
      <Form
        onSubmit={
          actionType === ActionType.CREATE ? onCreateSubmit : onUpdateSubmit
        }
        className="form_container"
      >
        <View className="form_item">
          <View className="form_label">?????????</View>
          <Input
            cursor-spacing={5}
            name="creator"
            className="form_input"
            placeholder="?????????????????????"
            placeholderClass="placeholder"
            value={
              actionType === ActionType.UPDATE ? updateInfo["creator"] : ""
            }
          />
        </View>
        <View className="form_item">
          <View className="form_label">????????????</View>
          <Input
            cursor-spacing={5}
            name="token"
            className="form_input"
            placeholder="??????6??????????????????"
            placeholderClass="placeholder"
            value={actionType === ActionType.UPDATE ? updateInfo["token"] : ""}
            disabled={actionType === ActionType.UPDATE}
            onClick={
              actionType === ActionType.UPDATE
                ? () => {
                    showToast("??????????????????");
                  }
                : () => {}
            }
          />
        </View>
        <View className="form_item">
          <View className="form_label">????????????</View>
          <Input
            cursor-spacing={5}
            name="className"
            className="form_input"
            placeholder="?????????????????????"
            placeholderClass="placeholder"
            value={
              actionType === ActionType.UPDATE ? updateInfo["className"] : ""
            }
          />
        </View>
        <View className="form_item">
          <View className="form_label">????????????</View>
          <Input
            cursor-spacing={5}
            name="count"
            type="number"
            className="form_input"
            placeholder={`??????????????????${countLimit}`}
            placeholderClass="placeholder"
            value={actionType === ActionType.UPDATE ? updateInfo["count"] : ""}
          />
        </View>
        <View className="form_item" onClick={chooseImage}>
          <View className="form_label">????????????</View>
          {imagePath.length !== 0 ? (
            <Image
              mode="aspectFill"
              className="selected_image"
              src={imagePath}
            />
          ) : (
            <View className="placeholder">????????????????????????</View>
          )}
          <Image className="select_arrow" src={selectArrow} />
        </View>
        <View className="form_item">
          <View className="form_label">???????????????</View>
          <AtSwitch
            checked={searchConfirm}
            border={false}
            onChange={onSearchConfirm}
            color={PRIMARY_COLOR}
          />
        </View>
        <Button
          formType="submit"
          className="form_btn"
          hoverClass="form_btn_hover"
        >
          {actionType === ActionType.CREATE ? "????????????" : "????????????"}
        </Button>
      </Form>
      <View className="notice">
        * {actionType === ActionType.CREATE ? "??????" : "????????????"}???????????????
        <Text
          className="attention_txt"
          onClick={() => Taro.navigateTo({ url: CREATE_ATTENTION })}
        >
          ????????????????????????
        </Text>
      </View>
      <View className="custom_small_ad" hidden={get(AD_HIDDEN)}>
        {/*<ad-custom unit-id="adunit-0d7af8f6497b81fd"></ad-custom>*/}
      </View>
    </View>
  );
}
CreateClass.config = {
  enablePullDownRefresh: true,
  enableShareTimeline: true,
  navigationBarTitleText: "????????????"
};
export default memo(CreateClass);
