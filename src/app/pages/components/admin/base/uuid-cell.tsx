import { jsx } from 'hono/jsx'

export interface UuidCellProps {
    uuid: string | null | undefined
    showFull?: boolean
    className?: string
}

export const UuidCell = (props: UuidCellProps) => {
    const { uuid, showFull = false, className = 'uuid' } = props;

    if (!uuid) {
        return <span class="null-value">NULL</span>;
    }

    if (showFull) {
        return <span class={className} title={uuid}>{uuid}</span>;
    }

    return (
        <span class={className} title={uuid}>
            {uuid.substring(0, 8)}...
        </span>
    );
}

// For table cells
export const UuidTableCell = (props: UuidCellProps) => {
    return (
        <td>
            <UuidCell {...props} />
        </td>
    );
}