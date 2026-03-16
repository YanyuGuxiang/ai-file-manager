/**
 * 百度翻译API调用示例和验证脚本
 *
 * 此文件提供了完整的百度翻译API调用示例，
 * 包括签名生成、错误处理和测试功能。
 */

// 加载环境变量
require('dotenv').config();

const crypto = require('crypto');
const axios = require('axios');

/**
 * 生成百度翻译API签名
 * 根据官方文档：appid + q + salt + 密钥 拼接后MD5加密
 */
function generateSign(appid, query, salt, secretKey) {
  const str = appid + query + salt + secretKey;
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * 完整的翻译函数，包含错误处理
 */
async function translateText(text) {
  const baiduAppid = process.env.BAIDU_TRANSLATE_APPID;
  const baiduSecret = process.env.BAIDU_TRANSLATE_SECRET;

  if (!baiduAppid || !baiduSecret) {
    throw new Error('BAIDU_TRANSLATE_APPID 或 BAIDU_TRANSLATE_SECRET 环境变量未设置');
  }

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

  try {
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
    } else if (response.data && response.data.error_code) {
      throw new Error(`API错误 [${response.data.error_code}]: ${response.data.error_msg}`);
    } else {
      throw new Error('API返回格式异常: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    if (error.response) {
      throw new Error(`HTTP错误 ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('请求发送失败，请检查网络连接');
    } else {
      throw error;
    }
  }
}

/**
 * 测试函数
 */
async function runTest() {
  console.log('=== 百度翻译API调用示例 ===\n');

  // 检查环境变量
  console.log('环境变量检查:');
  console.log('- BAIDU_TRANSLATE_APPID 存在:', !!process.env.BAIDU_TRANSLATE_APPID);
  console.log('- BAIDU_TRANSLATE_SECRET 存在:', !!process.env.BAIDU_TRANSLATE_SECRET);
  console.log('');

  if (!process.env.BAIDU_TRANSLATE_APPID || !process.env.BAIDU_TRANSLATE_SECRET) {
    console.error('❌ 错误: 请先设置环境变量');
    return;
  }

  // 隐藏敏感信息进行显示
  const appId = process.env.BAIDU_TRANSLATE_APPID;
  const secret = process.env.BAIDU_TRANSLATE_SECRET;
  const maskedAppId = appId.substring(0, 4) + '*'.repeat(Math.max(0, appId.length - 8)) + appId.substring(appId.length - 4);
  const maskedSecret = secret.substring(0, 4) + '*'.repeat(Math.max(0, secret.length - 8)) + secret.substring(secret.length - 4);

  console.log('当前配置:');
  console.log('- APP ID:', maskedAppId);
  console.log('- SECRET:', maskedSecret);
  console.log('');

  // 测试翻译
  const testTexts = ['Hello World', 'Good morning', 'How are you?'];

  for (const text of testTexts) {
    console.log(`正在翻译: "${text}"`);

    try {
      const result = await translateText(text);
      console.log(`✅ 成功: "${result}"`);
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
    }

    console.log('');
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runTest().catch(console.error);
}

// 导出函数供其他模块使用
module.exports = {
  generateSign,
  translateText
};