#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译API Python测试脚本
用于验证API连接和签名生成是否正确
"""

import os
import json
import hashlib
import requests
from urllib.parse import quote

def load_env():
    """从环境变量或.env文件加载API凭据"""
    try:
        # 尝试从.env文件加载
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    except FileNotFoundError:
        print("警告: 未找到 .env 文件，将从系统环境变量读取")

    appid = os.getenv('BAIDU_TRANSLATE_APPID')
    secret = os.getenv('BAIDU_TRANSLATE_SECRET')

    return appid, secret

def generate_sign(appid, query, salt, secret):
    """
    生成签名
    根据百度API文档：appid + q + salt + 密钥 拼接后MD5加密
    注意：拼接时q不进行URL编码
    """
    sign_str = appid + query + str(salt) + secret
    print(f"签名拼接字符串: {sign_str}")
    print(f"签名字符串长度: {len(sign_str)}")

    md5_hash = hashlib.md5()
    md5_hash.update(sign_str.encode('utf-8'))
    sign = md5_hash.hexdigest()

    print(f"生成的签名: {sign}")
    return sign

def translate_text(query, appid, secret):
    """调用百度翻译API"""
    import time

    salt = int(time.time() * 1000)  # 使用毫秒时间戳作为salt
    sign = generate_sign(appid, query, salt, secret)

    # 构建请求参数
    params = {
        'q': query,  # 原始查询文本
        'from': 'auto',
        'to': 'zh',
        'appid': appid,
        'salt': salt,
        'sign': sign
    }

    # 对请求参数进行URL编码（除了签名）
    encoded_params = {
        'q': query,  # 对查询文本进行URL编码
        'from': params['from'],
        'to': params['to'],
        'appid': params['appid'],
        'salt': params['salt'],
        'sign': params['sign']
    }

    url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'

    print(f"\n请求URL: {url}")
    print(f"请求参数（编码后）:")
    for k, v in encoded_params.items():
        if k in ['appid', 'salt', 'sign']:
            print(f"  {k}: {v}")
        else:
            print(f"  {k}: {v[:50]}{'...' if len(str(v)) > 50 else ''}")

    try:
        response = requests.post(url, data=encoded_params, headers={
            'Content-Type': 'application/x-www-form-urlencoded'
        })

        print(f"\n响应状态码: {response.status_code}")

        try:
            result = response.json()
            print(f"响应数据: {json.dumps(result, ensure_ascii=False, indent=2)}")

            if 'trans_result' in result:
                translated = '\n'.join([item['dst'] for item in result['trans_result']])
                print(f"\n✓ 翻译成功!")
                print(f"原文: {query}")
                print(f"译文: {translated}")
                return True
            elif 'error_code' in result:
                print(f"\n✗ API错误 [{result['error_code']}]: {result.get('error_msg', 'Unknown error')}")

                # 根据错误代码提供解决建议
                error_suggestions = {
                    '52001': '请求超时，请稍后重试',
                    '52002': '系统错误，请稍后重试',
                    '52003': '未授权的用户，请检查APP ID和密钥是否正确',
                    '54001': '签名错误，请检查密钥是否正确（区分大小写）',
                    '54003': '访问频率受限，请降低调用频率',
                    '54004': '账户余额不足',
                    '58000': '客户端IP非法，请检查IP白名单设置',
                    '58001': '译文语言不支持'
                }

                suggestion = error_suggestions.get(result['error_code'], '请参考百度翻译API文档解决此问题')
                print(f"解决建议: {suggestion}")
                return False
            else:
                print("\n✗ 响应格式异常")
                return False

        except json.JSONDecodeError:
            print(f"\n✗ 响应不是JSON格式: {response.text[:200]}...")
            return False

    except requests.exceptions.RequestException as e:
        print(f"\n✗ 请求异常: {str(e)}")
        return False

def main():
    print("百度翻译API Python测试脚本")
    print("=" * 50)

    # 加载API凭据
    appid, secret = load_env()

    print(f"APP ID 存在: {'✓' if appid else '✗'}")
    print(f"SECRET 存在: {'✓' if secret else '✗'}")

    if not appid or not secret:
        print("\n错误: 请先设置 BAIDU_TRANSLATE_APPID 和 BAIDU_TRANSLATE_SECRET 环境变量")
        print("可以在 .env 文件中设置，格式如下：")
        print("BAIDU_TRANSLATE_APPID=your_app_id")
        print("BAIDU_TRANSLATE_SECRET=your_secret_key")
        return

    # 隐藏敏感信息进行显示
    masked_appid = appid[:4] + '*' * max(0, len(appid)-8) + appid[-4:] if len(appid) > 8 else appid
    masked_secret = secret[:4] + '*' * max(0, len(secret)-8) + secret[-4:] if len(secret) > 8 else secret

    print(f"APP ID (部分隐藏): {masked_appid}")
    print(f"SECRET (部分隐藏): {masked_secret}")

    # 测试翻译
    test_texts = [
        'Hello World',
        'Good morning',
        'How are you?',
        'Artificial Intelligence',
        'Machine Learning'
    ]

    print(f"\n开始测试翻译功能...")
    print("-" * 30)

    success_count = 0
    for i, text in enumerate(test_texts, 1):
        print(f"\n[{i}/{len(test_texts)}] 测试翻译: '{text}'")
        if translate_text(text, appid, secret):
            success_count += 1
        print("-" * 30)

    print(f"\n测试完成！成功: {success_count}/{len(test_texts)}")

if __name__ == "__main__":
    main()