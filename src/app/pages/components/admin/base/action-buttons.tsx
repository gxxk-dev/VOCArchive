import { jsx } from 'hono/jsx'

export interface ActionButtonsProps {
    target: string
    uuid: string
    editText?: string
    deleteText?: string
    className?: string
}

export const ActionButtons = (props: ActionButtonsProps) => {
    const { target, uuid, editText = 'Edit', deleteText = 'Delete', className = 'actions' } = props;

    return (
        <div class={className}>
            <button class="edit-button" data-target={target} data-uuid={uuid}>
                {editText}
            </button>
            <button class="delete-button" data-target={target} data-uuid={uuid}>
                {deleteText}
            </button>
        </div>
    );
}

// For table cell actions
export const TableActionButtons = (props: ActionButtonsProps) => {
    return (
        <td class="actions">
            <button class="edit-button" data-target={props.target} data-uuid={props.uuid}>
                {props.editText || 'Edit'}
            </button>
            <button class="delete-button" data-target={props.target} data-uuid={props.uuid}>
                {props.deleteText || 'Delete'}
            </button>
        </td>
    );
}