// 全局变量
let originalImage = null;
let watermarkCanvas = null;
let currentSettings = {
    text: '版权声明',
    fontFamily: 'Microsoft YaHei',
    fontSize: 70,
    fontColor: '#ffffff',
    opacity: 0.5,
    direction: 'horizontal',
    spacing: 30,
    format: 'jpg',
    scale: 1.0
};

// 文案模板配置
const textTemplates = {
    copyright: {
        text: '© 2024 版权所有',
        fontSize: 28,
        fontColor: '#FF0000'
    },
    watermark: {
        text: '水印文字',
        fontSize: 32,
        fontColor: '#FFFFFF'
    },
    confidential: {
        text: '机密文件 严禁外传',
        fontSize: 70,
        fontColor: '#FFA500'
    },
    custom: {
        text: '自定义水印',
        fontSize: 70,
        fontColor: '#FFFFFF'
    }
};

// DOM 元素
const elements = {
    imageInput: document.getElementById('imageInput'),
    uploadArea: document.getElementById('uploadArea'),
    editorLayout: document.getElementById('editorLayout'),
    previewSection: document.getElementById('previewSection'),
    controlPanel: document.getElementById('controlPanel'),
    previewCanvas: document.getElementById('previewCanvas'),
    watermarkText: document.getElementById('watermarkText'),
    fontFamily: document.getElementById('fontFamily'),
    fontSize: document.getElementById('fontSize'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    fontColor: document.getElementById('fontColor'),
    opacity: document.getElementById('opacity'),
    opacityValue: document.getElementById('opacityValue'),
    directionButtons: document.querySelectorAll('.direction-btn'),
    spacing: document.getElementById('spacing'),
    spacingValue: document.getElementById('spacingValue'),
    format: document.getElementById('format'),
    scale: document.getElementById('scale'),
    scaleValue: document.getElementById('scaleValue'),
    downloadBtn: document.getElementById('downloadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    reuploadBtn: document.getElementById('reuploadBtn'),
    templateButtons: document.querySelectorAll('.template-btn')
};

/**
 * 初始化应用
 */
function init() {
    setupEventListeners();
    console.log('图片加水印工具已初始化');
}

/**
 * 设置所有事件监听器
 */
function setupEventListeners() {
    // 上传区域事件
    elements.uploadArea.addEventListener('click', () => elements.imageInput.click());
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('drop', handleDrop);

    // 文件输入事件
    elements.imageInput.addEventListener('change', handleImageUpload);

    // 水印文字输入事件
    elements.watermarkText.addEventListener('input', (e) => {
        currentSettings.text = e.target.value;
        updatePreview();
    });

    // 字体设置事件
    elements.fontFamily.addEventListener('change', (e) => {
        currentSettings.fontFamily = e.target.value;
        updatePreview();
    });

    elements.fontSize.addEventListener('input', (e) => {
        currentSettings.fontSize = parseInt(e.target.value);
        elements.fontSizeValue.textContent = `${e.target.value}px`;
        updatePreview();
    });

    elements.fontColor.addEventListener('input', (e) => {
        currentSettings.fontColor = e.target.value;
        updatePreview();
    });

    elements.opacity.addEventListener('input', (e) => {
        currentSettings.opacity = parseInt(e.target.value) / 100;
        elements.opacityValue.textContent = `${e.target.value}%`;
        updatePreview();
    });

    // 方向按钮事件
    elements.directionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.directionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSettings.direction = btn.dataset.direction;
            updatePreview();
        });
    });

    // 间距设置事件
    elements.spacing.addEventListener('input', (e) => {
        currentSettings.spacing = parseInt(e.target.value);
        elements.spacingValue.textContent = `${e.target.value}px`;
        updatePreview();
    });

    // 导出设置事件
    elements.format.addEventListener('change', (e) => {
        currentSettings.format = e.target.value;
    });

    elements.scale.addEventListener('input', (e) => {
        currentSettings.scale = parseInt(e.target.value) / 100;
        elements.scaleValue.textContent = `${e.target.value}%`;
        updatePreview();
    });

    // 模板按钮事件
    elements.templateButtons.forEach(btn => {
        btn.addEventListener('click', handleTemplateChange);
    });

    // 操作按钮事件
    elements.downloadBtn.addEventListener('click', downloadImage);
    elements.resetBtn.addEventListener('click', resetSettings);
    elements.reuploadBtn.addEventListener('click', () => elements.imageInput.click());
}

/**
 * 处理拖拽上传 - 拖拽经过时
 */
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#764ba2';
    e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.15)';
}

/**
 * 处理拖拽上传 - 拖拽释放时
 */
function handleDrop(e) {
    e.preventDefault();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }

    // 恢复上传区域样式
    const uploadArea = e.currentTarget;
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
}

/**
 * 处理图片上传
 */
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

/**
 * 处理图片文件
 */
function handleImageFile(file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }

    // 验证文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
        alert('图片文件过大，请选择10MB以下的图片！');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage = new Image();
        originalImage.onload = () => {
            // 隐藏上传区域，显示编辑区域
            elements.uploadArea.parentElement.style.display = 'none';
            elements.editorLayout.style.display = 'flex';

            // 初始化画布
            initCanvas();

            // 生成预览
            updatePreview();

            console.log('图片加载成功:', {
                width: originalImage.width,
                height: originalImage.height
            });
        };
        originalImage.onerror = () => {
            alert('图片加载失败，请检查图片格式！');
        };
        originalImage.src = e.target.result;
    };
    reader.onerror = () => {
        alert('文件读取失败！');
    };
    reader.readAsDataURL(file);
}

/**
 * 初始化画布
 */
function initCanvas() {
    if (!originalImage) return;

    const canvas = elements.previewCanvas;

    // 根据预览区容器的实际宽度来适配画布
    const containerWidth = elements.previewSection.clientWidth - 2; // 减去边框
    const maxWidth = containerWidth > 0 ? containerWidth : (window.innerWidth - 60);
    const maxHeight = window.innerWidth <= 768
        ? window.innerHeight * 0.45 - 2  // 移动端：45vh 限制
        : window.innerHeight - 80;        // 桌面端：几乎全高

    let canvasWidth = originalImage.width;
    let canvasHeight = originalImage.height;

    // 如果图片太大，按比例缩放
    if (canvasWidth > maxWidth) {
        const scale = maxWidth / canvasWidth;
        canvasWidth *= scale;
        canvasHeight *= scale;
    }

    if (canvasHeight > maxHeight) {
        const scale = maxHeight / canvasHeight;
        canvasWidth *= scale;
        canvasHeight *= scale;
    }

    // 设置CSS样式尺寸（逻辑像素）
    canvas.style.width = `${Math.floor(canvasWidth)}px`;
    canvas.style.height = `${Math.floor(canvasHeight)}px`;

    // 考虑设备像素比，防止在高DPI屏幕上模糊
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);

    // 缩放上下文以匹配设备像素比
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    watermarkCanvas = canvas;
}

/**
 * 更新预览
 */
function updatePreview() {
    if (!originalImage || !watermarkCanvas) return;

    const ctx = watermarkCanvas.getContext('2d');
    if (!ctx) return;

    // 获取显示尺寸
    const displayWidth = watermarkCanvas.offsetWidth;
    const displayHeight = watermarkCanvas.offsetHeight;

    // 清空画布
    ctx.clearRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);

    // 绘制原始图片到画布
    ctx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);

    // 创建临时画布用于添加水印
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = displayWidth;
    tempCanvas.height = displayHeight;

    // 复制当前画布内容到临时画布
    tempCtx.drawImage(watermarkCanvas, 0, 0, displayWidth, displayHeight);

    // 添加水印到临时画布
    addWatermarkToCanvas(tempCtx, displayWidth, displayHeight);

    // 将临时画布内容绘制回主画布
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(tempCanvas, 0, 0, displayWidth, displayHeight);
}

/**
 * 添加水印到画布
 */
function addWatermarkToCanvas(ctx, canvasWidth, canvasHeight) {
    // 保存当前状态
    ctx.save();

    // 设置字体样式
    const fontSize = currentSettings.fontSize * (canvasWidth / originalImage.width);
    // 使用通用字体族确保兼容性
    const fontFamily = currentSettings.fontFamily;
    if (fontFamily === 'Microsoft YaHei') {
        ctx.font = `${fontSize}px "Microsoft YaHei", "微软雅黑", sans-serif`;
    } else if (fontFamily === 'SimSun') {
        ctx.font = `${fontSize}px "SimSun", "宋体", serif`;
    } else if (fontFamily === 'SimHei') {
        ctx.font = `${fontSize}px "SimHei", "黑体", sans-serif`;
    } else if (fontFamily === 'KaiTi') {
        ctx.font = `${fontSize}px "KaiTi", "楷体", serif`;
    } else {
        ctx.font = `${fontSize}px ${fontFamily}, sans-serif`;
    }
    ctx.fillStyle = currentSettings.fontColor;
    ctx.globalAlpha = currentSettings.opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 获取文字度量信息
    const textMetrics = ctx.measureText(currentSettings.text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    // 根据方向计算水印位置
    let positions = [];

    switch (currentSettings.direction) {
        case 'horizontal':
            positions = calculateHorizontalPositions(canvasWidth, canvasHeight, textWidth, textHeight);
            break;
        case 'vertical':
            positions = calculateVerticalPositions(canvasWidth, canvasHeight, textWidth, textHeight);
            break;
        case 'diagonal':
            positions = calculateDiagonalPositions(canvasWidth, canvasHeight, textWidth, textHeight);
            break;
    }

    // 绘制水印
    positions.forEach(pos => {
        ctx.save();

        if (currentSettings.direction === 'diagonal') {
            // 对角线方向需要旋转
            ctx.translate(pos.x, pos.y);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(currentSettings.text, 0, 0);
        } else if (currentSettings.direction === 'vertical') {
            // 垂直方向
            ctx.translate(pos.x, pos.y);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(currentSettings.text, 0, 0);
        } else {
            // 水平方向
            ctx.fillText(currentSettings.text, pos.x, pos.y);
        }

        ctx.restore();
    });

    // 恢复状态
    ctx.restore();
}

/**
 * 计算水平方向水印位置
 */
function calculateHorizontalPositions(canvasWidth, canvasHeight, textWidth, textHeight) {
    const positions = [];
    const spacing = currentSettings.spacing * (canvasWidth / originalImage.width);

    let y = textHeight;
    while (y < canvasHeight) {
        let x = textWidth / 2;
        while (x < canvasWidth) {
            positions.push({ x, y });
            x += textWidth + spacing;
        }
        y += textHeight + spacing;
    }

    return positions;
}

/**
 * 计算垂直方向水印位置
 */
function calculateVerticalPositions(canvasWidth, canvasHeight, textWidth, textHeight) {
    const positions = [];
    const spacing = currentSettings.spacing * (canvasHeight / originalImage.height);

    let x = textHeight / 2; // 垂直时，文字高度变成宽度
    while (x < canvasWidth) {
        let y = textWidth / 2; // 垂直时，文字宽度变成高度
        while (y < canvasHeight) {
            positions.push({ x, y });
            y += textHeight + spacing;
        }
        x += textWidth + spacing;
    }

    return positions;
}

/**
 * 计算对角线方向水印位置
 */
function calculateDiagonalPositions(canvasWidth, canvasHeight, textWidth, textHeight) {
    const positions = [];
    const spacing = currentSettings.spacing * Math.min(canvasWidth / originalImage.width, canvasHeight / originalImage.height);

    // 对角线水印的间距需要更大一些
    const diagonalSpacing = spacing * 2;

    // 计算对角线水印的起始位置
    let y = textHeight;
    while (y < canvasHeight * 2) {
        let x = textWidth / 2;
        while (x < canvasWidth * 2) {
            positions.push({ x, y });
            x += textWidth + diagonalSpacing;
        }
        y += textHeight + diagonalSpacing;
    }

    return positions;
}

/**
 * 处理模板切换
 */
function handleTemplateChange(e) {
    // 更新活动状态
    elements.templateButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    const template = e.target.dataset.template;
    const templateConfig = textTemplates[template];

    // 应用模板设置
    currentSettings.text = templateConfig.text;
    currentSettings.fontSize = templateConfig.fontSize;
    currentSettings.fontColor = templateConfig.fontColor;

    // 更新UI
    elements.watermarkText.value = currentSettings.text;
    elements.fontSize.value = currentSettings.fontSize;
    elements.fontSizeValue.textContent = `${currentSettings.fontSize}px`;
    elements.fontColor.value = currentSettings.fontColor;

    // 更新预览
    updatePreview();
}

/**
 * 下载图片
 */
function downloadImage() {
    if (!originalImage) return;

    try {
        // 根据选择的格式确定 MIME 类型
        const format = currentSettings.format;
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';

        // 获取缩放比例
        const scale = currentSettings.scale;

        // 创建下载画布
        const downloadCanvas = document.createElement('canvas');
        const downloadCtx = downloadCanvas.getContext('2d');

        // 设置下载画布尺寸（基于原始图片尺寸和缩放比例）
        const downloadWidth = Math.floor(originalImage.width * scale);
        const downloadHeight = Math.floor(originalImage.height * scale);
        downloadCanvas.width = downloadWidth;
        downloadCanvas.height = downloadHeight;

        if (format === 'jpg') {
            // JPG 格式设置背景为白色
            downloadCtx.fillStyle = '#FFFFFF';
            downloadCtx.fillRect(0, 0, downloadWidth, downloadHeight);
            downloadCtx.drawImage(originalImage, 0, 0, downloadWidth, downloadHeight);
            addWatermarkToCanvas(downloadCtx, downloadWidth, downloadHeight);
        } else {
            // PNG 格式保留透明背景
            downloadCtx.drawImage(originalImage, 0, 0, downloadWidth, downloadHeight);
            addWatermarkToCanvas(downloadCtx, downloadWidth, downloadHeight);
        }

        // 生成数据 URL
        const dataUrl = downloadCanvas.toDataURL(mimeType, 0.9);

        // 创建下载链接
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        const originalName = 'watermarked-image';
        link.download = `${originalName}_${timestamp}.${format}`;
        link.href = dataUrl;

        // 触发下载
        link.click();

        console.log('图片下载成功:', {
            format: format,
            scale: scale,
            size: `${downloadWidth}x${downloadHeight}`
        });

    } catch (error) {
        console.error('图片下载失败:', error);
        alert('图片下载失败，请重试！');
    }
}

/**
 * 重置设置
 */
function resetSettings() {
    // 重置设置到默认值
    currentSettings = {
        text: '版权声明',
        fontFamily: 'Microsoft YaHei',
        fontSize: 70,
        fontColor: '#ffffff',
        opacity: 0.5,
        direction: 'horizontal',
        spacing: 30,
        format: 'jpg',
        scale: 1.0
    };

    // 重置UI
    elements.watermarkText.value = currentSettings.text;
    elements.fontFamily.value = currentSettings.fontFamily;
    elements.fontSize.value = currentSettings.fontSize;
    elements.fontSizeValue.textContent = '70px';
    elements.fontColor.value = currentSettings.fontColor;
    elements.opacity.value = 50;
    elements.opacityValue.textContent = '50%';
    elements.spacing.value = currentSettings.spacing;
    elements.spacingValue.textContent = '30px';
    elements.scale.value = 100;
    elements.scaleValue.textContent = '100%';
    elements.format.value = currentSettings.format;

    // 重置方向按钮
    elements.directionButtons.forEach(btn => btn.classList.remove('active'));
    elements.directionButtons[0].classList.add('active');

    // 重置模板按钮
    elements.templateButtons.forEach(btn => btn.classList.remove('active'));

    // 更新预览
    updatePreview();

    console.log('设置已重置');
}

/**
 * 窗口大小改变时重新调整画布
 */
window.addEventListener('resize', () => {
    if (originalImage && watermarkCanvas) {
        initCanvas();
        updatePreview();
    }
});

// 初始化应用
document.addEventListener('DOMContentLoaded', init);