import { jsx } from 'hono/jsx'

export interface VersionCardsProps {
    workInfo: any
}

export const VersionCards = (props: VersionCardsProps) => {
    const { workInfo } = props;
    
    const audioSources = workInfo.media_sources.filter((ms: any) => ms.is_music);
    const videoSources = workInfo.media_sources.filter((ms: any) => !ms.is_music);

    return (
        <div class="versions-container">
            {audioSources.length > 0 && (
                <div class="version-card" data-type="audio">
                    <div class="version-icon">
                        <span class="material-symbols-outlined">audiotrack</span>
                    </div>
                    <div class="version-details">
                        <h3>音频版本</h3>
                        <p>{audioSources[0].info}</p>
                    </div>
                    <a href={`/api/get/file/${audioSources[0].uuid}`} download={audioSources[0].file_name} class="download-btn">下载</a>
                </div>
            )}
            {videoSources.length > 0 && (
                <div class="version-card" data-type="video">
                    <div class="version-icon">
                        <span class="material-symbols-outlined">movie</span>
                    </div>
                    <div class="version-details">
                        <h3>视频版本</h3>
                        <p>{videoSources[0].info}</p>
                    </div>
                    <a href={`/api/get/file/${videoSources[0].uuid}`} download={videoSources[0].file_name} class="download-btn">下载</a>
                </div>
            )}
        </div>
    );
}