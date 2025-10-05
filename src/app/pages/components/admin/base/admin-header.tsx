import { jsx } from 'hono/jsx'

export interface AdminHeaderProps {
    title: string
    target: string
    createButtonText?: string
}

export const AdminHeader = (props: AdminHeaderProps) => {
    const { title, target, createButtonText } = props;
    const defaultCreateText = `Create New ${target.charAt(0).toUpperCase() + target.slice(1)}`;

    return (
        <div class="controls">
            <h2>{title}</h2>
            <button class="create-button" data-target={target}>
                {createButtonText || defaultCreateText}
            </button>
        </div>
    );
}