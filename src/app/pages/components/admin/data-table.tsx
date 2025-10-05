import { jsx } from 'hono/jsx'
import { AdminTable } from './base'

export interface DataTableProps {
    target: string
    data: any[]
    title?: string
}

export const DataTable = (props: DataTableProps) => {
    const { target, data, title } = props;

    const capTarget = target.charAt(0).toUpperCase() + target.slice(1);
    const displayTitle = title || capTarget;

    return (
        <AdminTable
            title={displayTitle}
            target={target}
            data={data}
            createButtonText={`Create New ${capTarget}`}
            emptyMessage={`No ${target} found.`}
        />
    );
}