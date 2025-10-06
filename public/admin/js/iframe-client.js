// iframe 内容事件处理脚本
// 用于处理管理后台 iframe 内的编辑、删除按钮点击事件

document.addEventListener('DOMContentLoaded', () => {
    console.log('Iframe handler script loaded');

    // 发送测试消息到父窗口以确认通信工作
    console.log('Sending test message to parent...');
    try {
        window.parent.postMessage({
            type: 'test-message',
            message: 'Iframe handler loaded successfully'
        }, '*');
        console.log('Test message sent');
    } catch (error) {
        console.error('Error sending test message:', error);
    }

    // 监听编辑和删除按钮点击事件
    document.addEventListener('click', (e) => {
        const target = e.target;

        // 处理编辑按钮点击
        if (target.classList.contains('edit-button')) {
            e.preventDefault();
            const buttonTarget = target.dataset.target;
            const uuid = target.dataset.uuid;

            console.log('Edit button clicked:', { target: buttonTarget, uuid });

            // 发送编辑请求到父窗口
            console.log('Sending postMessage to parent window...');
            console.log('window.parent:', window.parent);
            console.log('window.top:', window.top);

            try {
                window.parent.postMessage({
                    type: 'edit-request',
                    target: buttonTarget,
                    uuid: uuid
                }, '*');
                console.log('postMessage sent successfully');
            } catch (error) {
                console.error('Error sending postMessage:', error);
            }
        }

        // 处理删除按钮点击
        if (target.classList.contains('delete-button')) {
            e.preventDefault();
            const buttonTarget = target.dataset.target;
            const row = target.closest('.work-card') || target.closest('tr') || target.closest('.category-node');
            const uuid = row ? row.dataset.uuid : null;

            console.log('Delete button clicked:', { target: buttonTarget, uuid });

            if (uuid) {
                // 发送删除请求到父窗口
                window.parent.postMessage({
                    type: 'delete-request',
                    target: buttonTarget,
                    uuid: uuid,
                    element: row.outerHTML // 发送元素HTML以便父窗口可以移除它
                }, '*');
            }
        }

        // 处理创建按钮点击
        if (target.classList.contains('create-button')) {
            e.preventDefault();
            const buttonTarget = target.dataset.target;

            console.log('Create button clicked:', { target: buttonTarget });

            // 发送创建请求到父窗口
            window.parent.postMessage({
                type: 'create-request',
                target: buttonTarget
            }, '*');
        }
    });

    // 监听来自父窗口的消息
    window.addEventListener('message', (event) => {
        // 验证消息来源（在生产环境中应该验证 origin）
        if (event.data && event.data.type) {
            switch (event.data.type) {
                case 'theme-change':
                    // 处理主题变更
                    document.documentElement.setAttribute('data-theme', event.data.theme);
                    console.log('Theme changed to:', event.data.theme);
                    break;

                case 'refresh-content':
                    // 如果需要刷新内容，重新加载页面
                    window.location.reload();
                    break;

                case 'remove-row':
                    // 移除指定的行/卡片元素
                    if (event.data.uuid) {
                        const element = document.querySelector(`[data-uuid="${event.data.uuid}"]`);
                        if (element) {
                            element.remove();
                            console.log('Row removed:', event.data.uuid);
                        }
                    }
                    break;
            }
        }
    });

    // 通知父窗口 iframe 已准备就绪
    window.parent.postMessage({
        type: 'iframe-ready'
    }, '*');
});

// 处理长文本折叠功能
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('long-text-collapsible')) {
        const element = e.target;
        const isExpanded = element.classList.contains('expanded');

        if (isExpanded) {
            // 收起文本
            element.classList.remove('expanded');
            element.style.maxWidth = '';
            element.style.whiteSpace = 'nowrap';
            element.style.textOverflow = 'ellipsis';
        } else {
            // 展开文本
            element.classList.add('expanded');
            element.style.maxWidth = '400px';
            element.style.whiteSpace = 'normal';
            element.style.textOverflow = 'initial';
        }
    }
});