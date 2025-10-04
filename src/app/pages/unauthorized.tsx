import { jsx } from 'hono/jsx'

export const UnauthorizedPage = () => {
    return (
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>401 - Unauthorized</title>
                <link rel="stylesheet" href="/css/common.css" />
                <link rel="stylesheet" href="/css/admin.css" />
                <style dangerouslySetInnerHTML={{
                    __html: `
                    body {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background-color: #f4f7f9;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    }
                    .error-container {
                        text-align: center;
                        max-width: 500px;
                        padding: 40px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }
                    .error-code {
                        font-size: 3rem;
                        font-weight: bold;
                        color: #d93025;
                        margin: 0;
                    }
                    .error-title {
                        font-size: 1.5rem;
                        color: #333;
                        margin: 10px 0;
                    }
                    .error-message {
                        color: #666;
                        margin: 20px 0;
                        line-height: 1.6;
                    }
                    .back-button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #007bff;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        transition: background-color 0.2s;
                    }
                    .back-button:hover {
                        background-color: #0056b3;
                    }
                    [data-theme="dark"] body {
                        background-color: #121212;
                    }
                    [data-theme="dark"] .error-container {
                        background-color: #1a1a1a;
                        color: #e0e0e0;
                    }
                    [data-theme="dark"] .error-title {
                        color: #e0e0e0;
                    }
                    [data-theme="dark"] .error-message {
                        color: #b0b0b0;
                    }
                    `
                }}></style>
            </head>
            <body>
                <div class="error-container">
                    <h1 class="error-code">401</h1>
                    <h2 class="error-title">访问被拒绝</h2>
                    <p class="error-message">
                        您需要有效的身份验证才能访问此页面。<br />
                        请先登录管理后台。
                    </p>
                    <a href="/admin" class="back-button">返回登录页面</a>
                </div>
            </body>
        </html>
    )
}