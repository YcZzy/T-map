import Taro from '@tarojs/taro'
interface navigateOption {
    method: 'navigateTo' | 'redirectTo' | 'switchTab'
}
const PAGE_LEVEL_LIMIT = 10;
const gotoPage = (url, params = {}, options: navigateOption = { method: 'navigateTo' }) => {
    console.log(params, '111')
    const pages = Taro.getCurrentPages();
    let method = options.method || 'navigateTo';
    console.log(method, '222')
    if (url && typeof url === 'string') {
        if (method === 'navigateTo' && pages.length >= PAGE_LEVEL_LIMIT - 3) {
            method = 'redirectTo'
        }
        if (method === 'navigateTo' && pages.length === PAGE_LEVEL_LIMIT) {
            method = 'redirectTo'
        }
        if (method === 'switchTab') {
            method = 'switchTab'
        }
        let extend = '';
        for (let key in params) {
            extend += '&' + key + '=' + params[key];
        }
        if (extend.length) {
            url += '?' + extend.substr(1, extend.length - 1)
        }
        console.log(url, '12211')
        Taro[method]({ url })
    }
}

export { gotoPage }