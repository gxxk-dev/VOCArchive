import { jsx } from 'hono/jsx'

export const Pagination = () => {
    return (
        <div class="pagination" id="pagination">
            <button class="pagination-btn" id="prevPage">
                <i class="fas fa-arrow-left"></i> 上一页
            </button>
            <button class="pagination-btn" id="nextPage">
                下一页 <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    )
}