#!/usr/bin/env node

/**
 * 部署配置检查脚本
 * 运行: node scripts/check-deploy.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 检查部署配置...\n');

// 检查必要的文件
const requiredFiles = [
    '.github/workflows/deploy.yml',
    'vite.config.js',
    'package.json',
    'public/404.html'
];

let allGood = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 文件不存在`);
        allGood = false;
    }
});

// 检查package.json配置
try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log('\n📦 Package.json 配置检查:');
    
    if (packageJson.scripts.build) {
        console.log('✅ build 脚本存在');
    } else {
        console.log('❌ build 脚本缺失');
        allGood = false;
    }
    
    if (packageJson.homepage && packageJson.homepage.includes('github.io')) {
        console.log('✅ homepage 配置正确');
    } else {
        console.log('⚠️  homepage 需要更新为你的GitHub Pages地址');
        console.log('   格式: https://你的用户名.github.io/free-layout-demo');
    }
    
} catch (error) {
    console.log('❌ 无法读取 package.json');
    allGood = false;
}

// 检查vite配置
try {
    const vitePath = path.join(__dirname, '..', 'vite.config.js');
    const viteConfig = fs.readFileSync(vitePath, 'utf8');
    
    console.log('\n⚡ Vite 配置检查:');
    
    if (viteConfig.includes('base:')) {
        console.log('✅ base 路径配置存在');
    } else {
        console.log('❌ base 路径配置缺失');
        allGood = false;
    }
    
    if (viteConfig.includes('free-layout-demo')) {
        console.log('✅ 仓库名称配置正确');
    } else {
        console.log('⚠️  请确认仓库名称是否为 free-layout-demo');
    }
    
} catch (error) {
    console.log('❌ 无法读取 vite.config.js');
    allGood = false;
}

console.log('\n📋 部署检查完成!');

if (allGood) {
    console.log('\n🎉 所有配置检查通过！你可以推送到GitHub进行自动部署。');
    console.log('\n📝 下一步操作:');
    console.log('1. 确保仓库是公开的');
    console.log('2. 在Settings > Pages中选择"GitHub Actions"');
    console.log('3. 推送代码到main分支');
    console.log('4. 查看Actions标签页的部署状态');
} else {
    console.log('\n⚠️  发现配置问题，请修复后再试。');
}

console.log('\n🌐 部署成功后访问: https://你的用户名.github.io/free-layout-demo');
