// 简单的语言检测函数
function detectLanguage(text) {
  // 检查是否包含中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text) ? 'zh' : 'other';
}

// 不进行翻译，直接返回原文
async function translateToChinese(text) {
  return text;
}

// 直接返回原文，不做任何翻译
async function processDescription(description) {
  return {
    original: description,
    translated: description
  };
}

module.exports = {
  processDescription,
  detectLanguage,
  translateToChinese
};