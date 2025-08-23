import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { WorkList } from './components/work-list'
import { FloatingSearch } from './components/floating-search'
import { Pagination } from './components/pagination'
import { FooterSetting } from '../database'
import { CommonStyles } from './styles/common-styles'
import { IndexStyles } from './styles/index-styles'
import { IndexScripts } from './scripts/index-scripts'

export const IndexPage = (props: { works: any[], asset_url: string, footerSettings: FooterSetting[] }) => {
    const additionalStyles = `${CommonStyles}${IndexStyles}`;
    
    const additionalScripts = IndexScripts(props);
    
    const pageContent = (
        <>
            <div class="background-container">
                <div class="background-overlay" id="backgroundOverlay"></div>
                <div class="background-pattern" id="backgroundPattern"></div>
            </div>

            {FloatingSearch()}

            <div class="page-container" id="pageContainer">
                <header class="page-header">
                    <h1 class="page-title">VOCArchive - 作品选择</h1>
                </header>

                <section class="work-list-section">
                    <h2 class="section-title">
                        <i class="fas fa-list-music"></i> 歌曲列表
                    </h2>

                    <div class="work-list" id="workList">
                        {WorkList({ works: props.works, asset_url: props.asset_url })}
                    </div>

                    {Pagination()}
                </section>
            </div>
        </>
    );
    
    return BaseLayout({
        title: "VOCArchive - 作品选择",
        footerSettings: props.footerSettings,
        additionalStyles: additionalStyles,
        additionalScripts: additionalScripts,
        children: pageContent
    });
}
