import { jsx } from 'hono/jsx'

export interface ActionButtonsProps {
    target: string
    index: string
    editText?: string
    deleteText?: string
    className?: string
}

export const ActionButtons = (props: ActionButtonsProps) => {
    const { target, index, editText = 'Edit', deleteText = 'Delete', className = 'actions' } = props;

    return (
        <div class={className}>
            <button class="edit-button" data-target={target} data-index={index}>
                {editText}
            </button>
            <button class="delete-button" data-target={target} data-index={index}>
                {deleteText}
            </button>
        </div>
    );
}

// For table cell actions
export const TableActionButtons = (props: ActionButtonsProps) => {
    return (
        <td class="actions">
            <button class="edit-button" data-target={props.target} data-index={props.index}>
                {props.editText || 'Edit'}
            </button>
            <button class="delete-button" data-target={props.target} data-index={props.index}>
                {props.deleteText || 'Delete'}
            </button>
        </td>
    );
}