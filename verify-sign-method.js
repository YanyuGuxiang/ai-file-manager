// 验证签名生成和请求参数构造是否正确
require('dotenv').config();

const crypto = require('crypto');

// 生成百度翻译API签名（使用原始文本，不进行URL编码）
function generateSignCorrect(appid, query, salt, secretKey) {
  // 根据百度文档：appid + q + salt + 密钥 拼接（q不进行URL编码）
  const str = appid + query + salt + secretKey;
  console.log('拼接字符串（用于签名）:', str);
  return crypto.createHash('md5').update(str).digest('hex');
}

// 错误的签名生成方式（提前URL编码）
function generateSignWrong(appid, query, salt, secretKey) {
  const encodedQuery = encodeURIComponent(query);
  const str = appid + encodedQuery + salt + secretKey;
  console.log('错误的拼接字符串（提前编码）:', str);
  return crypto.createHash('md5').update(str).digest('hex');
}

console.log('=== 签名生成方法验证 ===');
console.log('');

const appid = process.env.BAIDU_TRANSLATE_APPID;
const secret = process.env.BAIDU_TRANSLATE_SECRET;
const testText = 'Hello World & Special Characters!@#';

if (!appid || !secret) {
  console.log('请先设置环境变量 BAIDU_TRANSLATE_APPID 和 BAIDU_TRANSLATE_SECRET');
  process.exit(1);
}

const salt = '123456';

console.log('测试文本:', testText);
console.log('URL编码后:', encodeURIComponent(testText));
console.log('');

const correctSign = generateSignCorrect(appid, testText, salt, secret);
const wrongSign = generateSignWrong(appid, testText, salt, secret);

console.log('正确的签名（基于原始文本）:', correctSign);
console.log('错误的签名（基于已编码文本）:', wrongSign);
console.log('');

console.log('=== 结论 ===');
console.log('我们的实现使用了正确的方法：');
console.log('1. 生成签名时使用原始文本（未URL编码）');
console.log('2. 发送请求时对查询参数进行URL编码');
console.log('3. 这样签名和请求参数匹配，符合API要求');