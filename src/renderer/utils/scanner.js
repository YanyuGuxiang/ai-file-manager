const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { processDescription } = require('./translator'); // 导入翻译功能

async function scanFiles(categories) {
  const results = {};

  for (const category of categories) {
    const categoryId = category.id;
    results[categoryId] = [];
    console.log(`\n=== 开始扫描类别: ${category.name} (${categoryId}) ===`);

    for (const searchPath of category.searchPaths) {
      console.log(`扫描路径: ${searchPath}`);
      if (!fs.existsSync(searchPath)) {
        console.warn(`路径不存在: ${searchPath}`);
        continue;
      }

      if (category.displayType === 'folder') {
        // 文件夹形式：扫描一级子文件夹
        const items = await scanFolderCategory(searchPath, category);
        console.log(`找到 ${items.length} 个文件夹`);
        results[categoryId].push(...items);
      } else if (category.displayType === 'file') {
        // 文件形式：递归扫描所有.md文件
        const items = await scanFileCategory(searchPath);
        console.log(`找到 ${items.length} 个文件`);
        results[categoryId].push(...items);
      }
    }
  }

  return results;
}

async function scanFolderCategory(searchPath, category) {
  const items = [];
  const folders = fs.readdirSync(searchPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`  子文件夹数量: ${folders.length}`);

  for (const folderName of folders) {
    const folderPath = path.join(searchPath, folderName);
    const descriptionFile = category.descriptionFile || 'description.md';
    const descriptionFilePath = path.join(folderPath, descriptionFile);

    let description = folderName; // 默认使用文件夹名称

    console.log(`  检查文件夹: ${folderName}, 描述文件: ${descriptionFile}`);
    if (fs.existsSync(descriptionFilePath)) {
      console.log(`    找到描述文件: ${descriptionFilePath}`);
      try {
        const content = fs.readFileSync(descriptionFilePath, 'utf8');
        console.log(`    文件前100字符: ${content.substring(0, 100).replace(/\n/g, '\\n')}`);

        // 尝试解析YAML front matter（支持Windows和Unix换行符）
        const frontMatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

        if (frontMatterMatch) {
          console.log(`    匹配到YAML front matter`);
          const yamlStr = frontMatterMatch[1];

          try {
            // 尝试标准YAML解析
            const frontMatter = yaml.load(yamlStr);
            if (frontMatter && frontMatter.description) {
              description = frontMatter.description;
              console.log(`    [YAML解析成功] ${folderName}: ${description.substring(0, 50)}...`);
            }
          } catch (yamlError) {
            console.log(`    [YAML解析失败] ${folderName}, 尝试手动提取`);
            // YAML解析失败，尝试手动提取description字段
            const descMatch = yamlStr.match(/description:\s*(.+?)(?:\n\w+:|$)/s);
            if (descMatch) {
              description = descMatch[1].trim();
              console.log(`    [手动提取成功] ${folderName}: ${description.substring(0, 50)}...`);
            } else {
              console.log(`    [手动提取失败] ${folderName}, 使用文件夹名`);
            }
          }
        } else {
          console.log(`    未匹配到YAML front matter`);
        }
      } catch (error) {
        console.error(`    解析描述文件出错 ${descriptionFilePath}:`, error);
      }
    } else {
      console.log(`    未找到描述文件，使用文件夹名: ${folderName}`);
    }

    // 对描述进行翻译处理
    const translationResult = await processDescription(description);

    items.push({
      id: `${category.id}-${folderName}`,
      name: folderName,
      description: translationResult.translated,
      originalDescription: translationResult.original, // 保留原始描述用于搜索
      path: folderPath,
      type: 'folder',
      isTranslating: false // 翻译完成后始终设置为false，因为processDescription内部已处理异步翻译
    });
  }

  return items;
}

async function scanFileCategory(searchPath) {
  const items = [];

  // 使用同步方式收集所有.md文件路径
  const mdFiles = [];

  function collectMdFiles(currentPath) {
    const dirents = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const dirent of dirents) {
      const fullPath = path.join(currentPath, dirent.name);

      if (dirent.isDirectory()) {
        // 递归扫描子目录
        collectMdFiles(fullPath);
      } else if (dirent.isFile() && path.extname(dirent.name) === '.md') {
        mdFiles.push(fullPath);
      }
    }
  }

  collectMdFiles(searchPath);

  // 处理所有收集到的文件
  for (const fullPath of mdFiles) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let description = path.basename(fullPath, '.md'); // 默认使用文件名（不含扩展名）

      // 尝试解析YAML front matter
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (frontMatterMatch) {
        const yamlStr = frontMatterMatch[1];
        const frontMatter = yaml.load(yamlStr);

        if (frontMatter && frontMatter.description) {
          description = frontMatter.description;
        }
      }

      // 对描述进行翻译处理
      const translationResult = await processDescription(description);

      items.push({
        id: `${path.basename(fullPath, '.md')}-${Date.now()}`,
        name: path.basename(fullPath, '.md'),
        description: translationResult.translated,
        originalDescription: translationResult.original, // 保留原始描述用于搜索
        path: fullPath,
        type: 'file',
        isTranslating: false // 翻译完成后始终设置为false，因为processDescription内部已处理异步翻译
      });
    } catch (error) {
      console.error(`Error processing file ${fullPath}:`, error);
      // 继续处理其他文件
    }
  }

  return items;
}

module.exports = {
  scanFiles
};