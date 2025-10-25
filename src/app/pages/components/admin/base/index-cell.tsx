import { jsx } from 'hono/jsx'

export interface IndexCellProps {
    index: string | null | undefined
    showFull?: boolean
    className?: string
}

export const IndexCell = (props: IndexCellProps) => {
    const { index, showFull = false, className = 'uuid' } = props;

    if (!index) {
        return <span class="null-value">NULL</span>;
    }

    if (showFull) {
        return <span class={className} title={index}>{index}</span>;
    }

    return (
        <span class={className} title={index}>
            {index.substring(0, 8)}...
        </span>
    );
}

// For table cells
export const IndexTableCell = (props: IndexCellProps) => {
    return (
        <td>
            <IndexCell {...props} />
        </td>
    );
}