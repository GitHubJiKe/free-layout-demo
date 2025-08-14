#!/usr/bin/env node

/**
 * npm 安装测试脚本
 * 运行: node scripts/test-npm.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 开始 npm 安装测试...\n');

// 检查npm版本
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`📦 npm 版本: ${npmVersion}`);
    
    const majorVersion = parseInt(npmVersion.split('.')[0]);
    if (majorVersion < 8) {
        console.log('❌ npm 版本过低，需要 8.0.0 或更高版本');
        console.log('   请升级 npm: npm install -g npm@latest');
        process.exit(1);
    } else {
        console.log('✅ npm 版本符合要求');
    }
} catch (error) {
    console.log('❌ 无法获取 npm 版本');
    process.exit(1);
}

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

// 检查package.json和package-lock.json
const packagePath = path.join(__dirname, '..', 'package.json');
const lockPath = path.join(__dirname, '..', 'package-lock.json');

if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json 不存在');
    process.exit(1);
}

if (!fs.existsSync(lockPath)) {
    console.log('⚠️  package-lock.json 不存在，将生成新的锁文件');
}

console.log('✅ package.json 存在');

// 清理之前的安装
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('\n🧹 清理之前的 node_modules...');
    try {
        fs.rmSync(nodeModulesPath, { recursive: true, force: true });
        console.log('✅ node_modules 已清理');
    } catch (error) {
        console.log('⚠️  清理 node_modules 失败，继续执行...');
    }
}

// 清理npm缓存
console.log('\n🧹 清理 npm 缓存...');
try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ npm 缓存已清理');
} catch (error) {
    console.log('⚠️  清理 npm 缓存失败，继续执行...');
}

// 测试npm install
console.log('\n📦 测试 npm install...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ npm install 成功');
} catch (error) {
    console.log('❌ npm install 失败');
    console.log('\n🔍 可能的解决方案:');
    console.log('1. 检查网络连接');
    console.log('2. 尝试使用镜像源: npm config set registry https://registry.npmmirror.com');
    console.log('3. 检查 package.json 语法');
    console.log('4. 尝试删除 package-lock.json 后重新安装');
    process.exit(1);
}

// 测试npm ci
console.log('\n🔒 测试 npm ci...');
try {
    execSync('npm ci', { stdio: 'inherit' });
    console.log('✅ npm ci 成功');
} catch (error) {
    console.log('❌ npm ci 失败');
    console.log('\n🔍 可能的解决方案:');
    console.log('1. 确保 package-lock.json 与 package.json 同步');
    console.log('2. 尝试重新生成 package-lock.json');
    console.log('3. 检查依赖版本冲突');
    process.exit(1);
}

// 检查安装的依赖
console.log('\n📋 检查安装的依赖...');
try {
    const dependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = ['vue', '@vitejs/plugin-vue', 'vite', 'less'];
    
    requiredDeps.forEach(dep => {
        if (dependencies.dependencies && dependencies.dependencies[dep]) {
            console.log(`✅ ${dep}: ${dependencies.dependencies[dep]}`);
        } else if (dependencies.devDependencies && dependencies.devDependencies[dep]) {
            console.log(`✅ ${dep}: ${dependencies.devDependencies[dep]} (dev)`);
        } else {
            console.log(`❌ ${dep}: 未找到`);
        }
    });
} catch (error) {
    console.log('❌ 无法检查依赖信息');
}

console.log('\n🎉 npm 安装测试完成！');
console.log('\n📝 下一步:');
console.log('- 运行 npm run build 测试构建');
console.log('- 运行 npm run test-build 进行完整测试');
