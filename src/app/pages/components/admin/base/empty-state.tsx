import { jsx } from 'hono/jsx'
import { AdminHeader, AdminHeaderProps } from './admin-header'

export interface EmptyStateProps extends AdminHeaderProps {
    message?: string
    isError?: boolean
}

export const EmptyState = (props: EmptyStateProps) => {
    const { title, target, createButtonText, message, isError = false } = props;
    const defaultMessage = `No ${target} found.`;

    return (
        <div>
            <AdminHeader
                title={title}
                target={target}
                createButtonText={createButtonText}
            />
            <p class={isError ? "error-message" : ""}>
                {message || defaultMessage}
            </p>
        </div>
    );
}