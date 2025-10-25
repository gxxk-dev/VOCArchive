export const PlayerScripts = (props: { workInfo: any }) => `
function setupPlayerEventListeners() {
    // Handle tag and category clicks
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.tag-chip.clickable, .category-chip.clickable, .tags-expand');
        if (!target) return;

        e.preventDefault();
        e.stopPropagation();

        if (target.classList.contains('tag-chip')) {
            const tagUuid = target.dataset.tag;
            if (tagUuid) {
                window.location.href = \`/?tag=\${encodeURIComponent(tagUuid)}\`;
            }
        } else if (target.classList.contains('category-chip')) {
            const categoryUuid = target.dataset.category;
            if (categoryUuid) {
                window.location.href = \`/?category=\${encodeURIComponent(categoryUuid)}\`;
            }
        } else if (target.classList.contains('tags-expand')) {
            expandPlayerTags(target);
        }
    });

    // Handle version card clicks for mobile download
    document.addEventListener('click', function(e) {
        const versionCard = e.target.closest('.version-card');
        if (!versionCard) return;

        // Don't trigger if clicking on download button directly
        if (e.target.closest('.download-btn')) return;

        const downloadBtn = versionCard.querySelector('.download-btn');
        if (downloadBtn) {
            // Trigger download
            downloadBtn.click();
        }
    });
}

function expandPlayerTags(expandButton) {
    const workUuid = expandButton.dataset.work;
    const workData = ${JSON.stringify(props.workInfo)};
    
    if (!workData.tags || workData.tags.length <= 5) return;
    
    const hiddenTags = workData.tags.slice(5);
    const tagsHtml = hiddenTags.map(tag => 
        \`<span class="tag-chip clickable" data-tag="\${tag.uuid}">\${tag.name}</span>\`
    ).join('');
    
    // Replace the expand button with the hidden tags
    expandButton.outerHTML = tagsHtml;
}

document.addEventListener('DOMContentLoaded', () => {
    setupPlayerEventListeners();

    // Initialize IPFS settings UI
    const ipfsSettingsUI = new window.IPFSSettingsUI();
    const ipfsSettingsBtn = document.getElementById('ipfs-settings-btn');
    if (ipfsSettingsBtn) {
        ipfsSettingsBtn.addEventListener('click', () => {
            ipfsSettingsUI.toggle();
        });
    }
});
`