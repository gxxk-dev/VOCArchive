import { jsx } from 'hono/jsx'
import { Footer } from '../footer'
import { FooterSetting } from '../../db/operations/admin'

export interface BaseLayoutProps {
    title: string
    children: any
    footerSettings: FooterSetting[]
    additionalStyles?: string
    additionalScripts?: string
    bodyClass?: string
}

export const BaseLayout = (props: BaseLayoutProps) => {
    return (
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{props.title}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                <style dangerouslySetInnerHTML={{ __html: props.additionalStyles || '' }}></style>
            </head>
            <body class={props.bodyClass || ''}>
                {props.children}
                <script dangerouslySetInnerHTML={{ __html: props.additionalScripts || '' }}></script>
                {Footer({ settings: props.footerSettings })}
            </body>
        </html>
    )
}