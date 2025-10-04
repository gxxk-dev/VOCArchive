import { jsx } from 'hono/jsx'
import { WorkListItem } from '../../../db/types'

export interface WorkCardProps {
    works: WorkListItem[]
}

export const WorkCard = (props: WorkCardProps) => {
    if (!props.works || props.works.length === 0) {
        return (
            <div class="controls">
                <h2>Work</h2>
                <button class="create-button" data-target="work">Create New Work</button>
                <p>No work found.</p>
            </div>
        )
    }

    return (
        <div>
            <div class="controls">
                <h2>Work</h2>
                <button class="create-button" data-target="work">Create New Work</button>
            </div>
            <div id="work-grid">
                {props.works.map(work => {
                    const title = work.titles.find(t => t.is_official)?.title || work.titles[0]?.title || 'Untitled';
                    const imageUrl = work.preview_asset ? `/api/get/file/${work.preview_asset.uuid}` : 'https://via.placeholder.com/300x200.png?text=No+Image';

                    return (
                        <div class="work-card" data-uuid={work.work_uuid}>
                            <div class="work-card-image">
                                <img src={imageUrl} alt={title} loading="lazy" />
                            </div>
                            <div class="work-card-content">
                                <h3 class="work-card-title">{title}</h3>
                                <p class="work-card-uuid uuid">{work.work_uuid}</p>
                            </div>
                            <div class="work-card-actions">
                                <button class="edit-button" data-target="work" data-uuid={work.work_uuid}>Edit</button>
                                <button class="delete-button" data-target="work">Delete</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}