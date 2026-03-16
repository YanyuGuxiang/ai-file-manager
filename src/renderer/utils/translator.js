const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 中文检测函数
function detectLanguage(text) {
  // 检查是否包含中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text) ? 'zh' : 'other';
}

// 生成百度翻译API的签名
function generateSign(appid, query, salt, secretKey) {
  const str = appid + query + salt + secretKey;
  return crypto.createHash('md5').update(str).digest('hex');
}

// 翻译文本的异步函数
async function translateText(text) {
  // 检查必要的环境变量
  const baiduAppid = process.env.BAIDU_TRANSLATE_APPID;
  const baiduSecret = process.env.BAIDU_TRANSLATE_SECRET;

  if (!baiduAppid || !baiduSecret) {
    console.warn('BAIDU_TRANSLATE_APPID 或 BAIDU_TRANSLATE_SECRET 环境变量未设置');
    console.log('翻译函数: 由于缺少环境变量，直接返回原文');
    return text; // 返回原文
  }

  console.log('翻译函数: 开始调用百度翻译API，原文:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

  try {
    const axios = require('axios');
    const salt = Date.now().toString();
    const sign = generateSign(baiduAppid, text, salt, baiduSecret);

    const params = new URLSearchParams({
      q: text,  // 根据百度API要求，查询文本不需要URL编码
      from: 'auto',
      to: 'zh',
      appid: baiduAppid,
      salt: salt,
      sign: sign
    });

    const response = await axios.post(
      'https://fanyi-api.baidu.com/api/trans/vip/translate',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data && response.data.trans_result) {
      const translated = response.data.trans_result.map(item => item.dst).join('\n');
      console.log('翻译函数: API调用成功，译文:', translated.substring(0, 50) + (translated.length > 50 ? '...' : ''));
      return translated;
    } else {
      // 检查是否有错误码
      if (response.data && response.data.error_code) {
        console.error(`翻译API返回错误 [${response.data.error_code}]: ${response.data.error_msg}`);

        // 对于常见的认证错误，避免重复尝试
        if (['52001', '52002', '52003', '54001', '58001'].includes(response.data.error_code)) {
          console.log('翻译函数: API认证失败，将返回原文并避免重复调用');
          return text; // 返回原文，不再尝试
        }
      } else {
        console.error('翻译API返回格式异常:', response.data);
      }

      return text; // 返回原文
    }
  } catch (error) {
    console.error('翻译API调用失败:', error.message);
    return text; // 返回原文
  }
}

// 加载翻译缓存
function loadTranslationCache() {
  const cachePath = path.join(__dirname, '..', '..', '..', 'translation-cache.json');
  try {
    if (fs.existsSync(cachePath)) {
      const cacheData = fs.readFileSync(cachePath, 'utf8');
      return JSON.parse(cacheData);
    }
  } catch (error) {
    console.warn('加载翻译缓存失败:', error.message);
  }
  return {};
}

// 保存翻译缓存
function saveTranslationCache(cache) {
  const cachePath = path.join(__dirname, '..', '..', '..', 'translation-cache.json');
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('保存翻译缓存失败:', error.message);
  }
}

// 处理描述文本，根据需要进行翻译
async function processDescription(description) {
  if (!description) {
    console.log('翻译函数: 描述为空，返回空字符串');
    return {
      original: '',
      translated: ''
    };
  }

  console.log('翻译函数: 检查描述是否为中文 -', description.substring(0, 50) + (description.length > 50 ? '...' : ''));

  // 检测是否为中文
  if (detectLanguage(description) === 'zh') {
    console.log('翻译函数: 描述已为中文，无需翻译');
    return {
      original: description,
      translated: description // 如果已经是中文，则不翻译
    };
  }

  console.log('翻译函数: 描述不是中文，开始翻译流程');

  // 尝试从缓存中获取翻译结果
  const cache = loadTranslationCache();
  const cacheKey = description.trim(); // 使用原文本作为缓存键
  if (cache[cacheKey]) {
    console.log('翻译函数: 从缓存中找到翻译结果');
    return {
      original: description,
      translated: cache[cacheKey],
      fromCache: true
    };
  }

  console.log('翻译函数: 缓存中未找到，调用API进行翻译');

  // 调用API进行翻译
  const translatedText = await translateText(description);

  // 只有当翻译成功且不是直接返回原文的情况下，才保存到缓存
  if (translatedText !== description || !cache[cacheKey]) {
    // 将新的翻译结果保存到缓存
    cache[cacheKey] = translatedText;
    saveTranslationCache(cache);
  }

  console.log('翻译函数: 翻译完成，原文:', description.substring(0, 50) + (description.length > 50 ? '...' : ''), '-> 译文:', translatedText.substring(0, 50) + (translatedText.length > 50 ? '...' : ''));

  return {
    original: description,
    translated: translatedText
  };
}

module.exports = {
  processDescription,
  detectLanguage,
  translateText,
  loadTranslationCache,
  saveTranslationCache
};