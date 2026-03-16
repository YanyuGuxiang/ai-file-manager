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
    return text; // 返回原文
  }

  try {
    const axios = require('axios');
    const salt = Date.now().toString();
    const sign = generateSign(baiduAppid, text, salt, baiduSecret);

    const params = new URLSearchParams({
      q: encodeURIComponent(text),
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
      return response.data.trans_result.map(item => item.dst).join('\n');
    } else {
      console.error('翻译API返回格式异常:', response.data);
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
    return {
      original: '',
      translated: ''
    };
  }

  // 检测是否为中文
  if (detectLanguage(description) === 'zh') {
    return {
      original: description,
      translated: description // 如果已经是中文，则不翻译
    };
  }

  // 尝试从缓存中获取翻译结果
  const cache = loadTranslationCache();
  const cacheKey = description.trim(); // 使用原文本作为缓存键
  if (cache[cacheKey]) {
    return {
      original: description,
      translated: cache[cacheKey],
      fromCache: true
    };
  }

  // 调用API进行翻译
  const translatedText = await translateText(description);

  // 将新的翻译结果保存到缓存
  cache[cacheKey] = translatedText;
  saveTranslationCache(cache);

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