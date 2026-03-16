# 百度翻译API配置指南

## 环境变量配置

本项目使用百度翻译开放平台API，需要配置以下环境变量：

1. **BAIDU_TRANSLATE_APPID**: 百度翻译API的应用ID
2. **BAIDU_TRANSLATE_SECRET**: 百度翻译API的应用密钥

### Windows 系统设置环境变量

通过命令行设置（临时）：
```cmd
set BAIDU_TRANSLATE_APPID=your_app_id
set BAIDU_TRANSLATE_SECRET=your_secret_key
```

通过命令行设置（永久）：
```cmd
setx BAIDU_TRANSLATE_APPID "your_app_id"
setx BAIDU_TRANSLATE_SECRET "your_secret_key"
```

### 验证环境变量

启动应用前，请确保已正确设置环境变量。可以通过以下方式验证：

```cmd
echo %BAIDU_TRANSLATE_APPID%
echo %BAIDU_TRANSLATE_SECRET%
```

## 百度翻译API申请步骤

1. 访问 [百度翻译开放平台](https://api.fanyi.baidu.com/)
2. 注册账号并登录
3. 进入控制台，创建应用
4. 获取APP ID和密钥
5. 按照上面的方法设置环境变量

## 注意事项

- API调用可能产生费用，请注意查看百度翻译API的收费标准
- 确保网络连接正常，以便访问百度翻译API
- 如果环境变量未设置，应用将保留原始文本而不进行翻译