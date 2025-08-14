#!/usr/bin/env node

/**
 * 构建测试脚本
 * 运行: node scripts/test-build.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 开始构建测试...\n');

// 检查Node.js版本
try {
    const nodeVersion = process.version;
    console.log(`📋 Node.js 版本: ${nodeVersion}`);
    
    const majorVersion = parseInt(process.version.slice(1).split('.')[0]);
    if (majorVersion < 18) {
        console.log('❌ Node.js 版本过低，需要 18.0.0 或更高版本');
        console.log('   请升级 Node.js: https://nodejs.org/');
        process.exit(1);
    } else {
        console.log('✅ Node.js 版本符合要求');
    }
} catch (error) {
    console.log('❌ 无法获取 Node.js 版本');
    process.exit(1);
}

// 检查npm版本
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`📦 npm 版本: ${npmVersion}`);
    
    const majorVersion = parseInt(npmVersion.split('.')[0]);
    if (majorVersion < 8) {
        console.log('⚠️  npm 版本较低，建议升级到 8.0.0 或更高版本');
    } else {
        console.log('✅ npm 版本符合要求');
    }
} catch (error) {
    console.log('❌ 无法获取 npm 版本');
}

// 检查依赖是否安装
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('\n📦 依赖未安装，正在安装...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ 依赖安装完成');
    } catch (error) {
        console.log('❌ 依赖安装失败');
        process.exit(1);
    }
} else {
    console.log('✅ 依赖已安装');
}

// 清理之前的构建
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    console.log('\n🧹 清理之前的构建...');
    try {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log('✅ 构建目录已清理');
    } catch (error) {
        console.log('⚠️  清理构建目录失败，继续执行...');
    }
}

// 执行构建
console.log('\n🔨 开始构建...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('\n✅ 构建成功！');
    
    // 检查构建输出
    if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        console.log(`📁 构建输出文件: ${files.length} 个文件`);
        files.forEach(file => {
            const filePath = path.join(distPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                const subFiles = fs.readdirSync(filePath);
                console.log(`  📂 ${file}/ (${subFiles.length} 个文件)`);
            } else {
                console.log(`  📄 ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
            }
        });
    }
    
} catch (error) {
    console.log('\n❌ 构建失败！');
    console.log('\n🔍 可能的解决方案:');
    console.log('1. 检查 Node.js 版本 (需要 18+)');
    console.log('2. 删除 node_modules 并重新安装依赖');
    console.log('3. 检查 vite.config.js 配置');
    console.log('4. 查看错误日志获取更多信息');
    process.exit(1);
}

console.log('\n🎉 构建测试完成！');
console.log('\n📝 下一步:');
console.log('- 运行 npm run preview 预览构建结果');
console.log('- 运行 npm run deploy 部署到 GitHub Pages');
