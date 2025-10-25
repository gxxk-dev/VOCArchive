import { jsx } from 'hono/jsx'
import { WorkListItem } from '../../../db/types'
import { AdminHeader, EmptyState, ActionButtons } from './base'

export interface WorkCardProps {
    works: WorkListItem[]
}

export const WorkCard = (props: WorkCardProps) => {
    if (!props.works || props.works.length === 0) {
        return (
            <EmptyState
                title="Work"
                target="work"
                createButtonText="Create New Work"
                message="No work found."
            />
        )
    }

    return (
        <div>
            <AdminHeader
                title="Work"
                target="work"
                createButtonText="Create New Work"
            />
            <div id="work-grid">
                {props.works.map(work => {
                    const title = work.titles.find(t => t.is_official)?.title || work.titles[0]?.title || 'Untitled';
                    const imageUrl = work.preview_asset ? `/api/get/file/${work.preview_asset.index}` : 'https://via.placeholder.com/300x200.png?text=No+Image';

                    return (
                        <div class="work-card" data-index={work.work_index}>
                            <div class="work-card-image">
                                <img src={imageUrl} alt={title} loading="lazy" />
                            </div>
                            <div class="work-card-content">
                                <h3 class="work-card-title">{title}</h3>
                                <p class="work-card-id-index">ID: {work.work_id} / Index: {work.work_index}</p>
                            </div>
                            <ActionButtons
                                target="work"
                                index={work.work_index}
                                editText="Edit"
                                deleteText="Delete"
                                className="work-card-actions"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    )
}