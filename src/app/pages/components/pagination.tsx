import { jsx } from 'hono/jsx'

export const Pagination = (props?: { 
    currentPage: number, 
    totalCount: number, 
    pageSize: number,
    filterInfo?: {
        type: 'tag' | 'category',
        name: string,
        uuid: string
    } | null,
    searchQuery: string
}) => {
    if (!props) {
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

    const totalPages = Math.ceil(props.totalCount / props.pageSize);
    const currentPage = props.currentPage;
    const showPrev = currentPage > 1;
    const showNext = currentPage < totalPages;
    
    const startResult = (currentPage - 1) * props.pageSize + 1;
    const endResult = Math.min(currentPage * props.pageSize, props.totalCount);

    return (
        <div class="pagination" id="pagination">
            <div class="pagination-info">
                显示第 {startResult} - {endResult} 项，共 {props.totalCount} 项结果
            </div>
            <div class="pagination-controls">
                <button 
                    class="pagination-btn" 
                    id="prevPage" 
                    disabled={!showPrev}
                    style={showPrev ? '' : 'opacity: 0.5; cursor: not-allowed;'}
                >
                    <i class="fas fa-arrow-left"></i> 上一页
                </button>
                
                <span class="pagination-current">
                    第 {currentPage} / {totalPages} 页
                </span>
                
                <button 
                    class="pagination-btn" 
                    id="nextPage" 
                    disabled={!showNext}
                    style={showNext ? '' : 'opacity: 0.5; cursor: not-allowed;'}
                >
                    下一页 <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    )
}