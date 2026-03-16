# 百度翻译API配置检查清单

## 1. 检查当前配置

首先检查您当前的配置：

```bash
# 查看 .env 文件内容
type .env
```

您应该看到类似这样的内容：
```
BAIDU_TRANSLATE_APPID=您真实的APP_ID
BAIDU_TRANSLATE_SECRET=您真实的SECRET_KEY
```

## 2. 验证API凭据

运行测试脚本来验证凭据：

```bash
node test-baidu-translate.js
```

## 3. 如果仍然收到 52003 错误，请按以下步骤操作：

### 步骤1: 登录百度翻译开放平台
1. 访问 https://api.fanyi.baidu.com/
2. 使用您的账号登录

### 步骤2: 检查应用信息
1. 进入"管理控制台"
2. 找到您创建的应用
3. 确认APP ID和密钥是否正确

### 步骤3: 检查服务开通状态
1. 确认"通用翻译API"服务是否已开通
2. 检查账户是否已完成实名认证

### 步骤4: 更新 .env 文件
将正确的APP ID和密钥更新到 .env 文件中：

```env
BAIDU_TRANSLATE_APPID=真实的应用ID
BAIDU_TRANSLATE_SECRET=真实的密钥
```

### 步骤5: 重启应用
更新配置后，请重启应用使更改生效。

## 4. 测试成功示例

当配置正确时，测试脚本应输出类似：

```
✓ 翻译成功!
原文: Hello World
译文: 你好世界
```

## 5. 其他注意事项

- 如果设置了IP白名单，请确保您的IP地址已添加到白名单中
- 百度翻译API有调用频率限制，请注意不要超过限制
- 如果账户余额不足，也可能导致认证失败