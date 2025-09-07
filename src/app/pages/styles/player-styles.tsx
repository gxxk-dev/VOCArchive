export const PlayerStyles = `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');

:root {
    /* Material Design 3 Color Tokens */
    --md-sys-color-primary: #6750A4;
    --md-sys-color-on-primary: #FFFFFF;
    --md-sys-color-primary-container: #EADDFF;
    --md-sys-color-on-primary-container: #21005D;
    
    --md-sys-color-secondary: #625B71;
    --md-sys-color-on-secondary: #FFFFFF;
    --md-sys-color-secondary-container: #E8DEF8;
    --md-sys-color-on-secondary-container: #1D192B;
    
    --md-sys-color-tertiary: #7D5260;
    --md-sys-color-on-tertiary: #FFFFFF;
    --md-sys-color-tertiary-container: #FFD8E4;
    --md-sys-color-on-tertiary-container: #31111D;
    
    --md-sys-color-surface: #1C1B1F;
    --md-sys-color-surface-container-lowest: #0F0D13;
    --md-sys-color-surface-container-low: #1D1B20;
    --md-sys-color-surface-container: #211F26;
    --md-sys-color-surface-container-high: #2B2930;
    --md-sys-color-surface-container-highest: #36343B;
    --md-sys-color-on-surface: #E6E0E9;
    --md-sys-color-on-surface-variant: #CAC4D0;
    
    --md-sys-color-outline: #938F99;
    --md-sys-color-outline-variant: #49454F;
    
    /* Elevation */
    --md-sys-elevation-level1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
    --md-sys-elevation-level3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
    
    /* Shape */
    --md-sys-shape-corner-small: 8px;
    --md-sys-shape-corner-medium: 12px;
    --md-sys-shape-corner-large: 16px;
    --md-sys-shape-corner-extra-large: 28px;
}

body {
    font-family: 'Roboto', sans-serif;
    background-color: var(--md-sys-color-surface);
    color: var(--md-sys-color-on-surface);
    min-height: 100vh;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-image: 
        radial-gradient(circle at 20% 50%, rgba(103, 80, 164, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(125, 82, 96, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(98, 91, 113, 0.1) 0%, transparent 50%);
}

/* Main Container */
.player-container {
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
    background-color: var(--md-sys-color-surface-container);
    border-radius: var(--md-sys-shape-corner-extra-large);
    padding: 32px;
    box-shadow: var(--md-sys-elevation-level3);
    border: 1px solid var(--md-sys-color-outline-variant);
    animation: fadeInUp 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
}

/* Song Header */
.work-header {
    text-align: center;
    margin-bottom: 40px;
}

.work-title {
    font-size: 2.75rem;
    font-weight: 400;
    line-height: 3.25rem;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
    color: var(--md-sys-color-on-surface);
}

.work-creator {
    font-size: 1rem;
    line-height: 1.5rem;
    letter-spacing: 0.5px;
    color: var(--md-sys-color-on-surface-variant);
    font-weight: 400;
}

/* Version Cards Container */
.versions-container {
    display: flex;
    gap: 24px;
    width: 100%;
    margin-bottom: 32px;
    flex-wrap: wrap;
}

.version-card {
    flex: 1;
    min-width: 280px;
    background: var(--md-sys-color-surface-container-low);
    border-radius: var(--md-sys-shape-corner-large);
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    border: 1px solid var(--md-sys-color-outline-variant);
    transition: all 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
    cursor: pointer;
}

.version-card.active {
    border-color: var(--md-sys-color-primary);
    background: var(--md-sys-color-primary-container);
}

.version-card.active .version-icon {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
}

.version-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--md-sys-color-surface-container-high);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
}

.version-details {
    flex: 1;
}

.version-details h3 {
    font-size: 1.25rem;
    margin-bottom: 4px;
    color: var(--md-sys-color-on-surface);
}

.version-details p {
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
    margin-bottom: 2px;
}

.download-btn {
    padding: 10px 20px;
    background: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
}

.download-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--md-sys-elevation-level1);
}

/* asset Section */
.asset-section {
    background-color: var(--md-sys-color-surface-container-low);
    border-radius: var(--md-sys-shape-corner-large);
    padding: 24px;
    margin-bottom: 16px;
    border: 1px solid var(--md-sys-color-outline-variant);
}

.setting-label {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    letter-spacing: 0.1px;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.asset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
}

.asset-card {
    background: var(--md-sys-color-surface-container-high);
    border-radius: var(--md-sys-shape-corner-medium);
    padding: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
    border: 1px solid var(--md-sys-color-outline-variant);
}

.asset-card:hover {
    border-color: var(--md-sys-color-primary);
    box-shadow: var(--md-sys-elevation-level1);
}

.asset-card .material-symbols-outlined {
    font-size: 32px;
    margin-bottom: 12px;
    color: var(--md-sys-color-primary);
}

.asset-details h4 {
    font-size: 1rem;
    margin-bottom: 4px;
    color: var(--md-sys-color-on-surface);
}

.asset-details p {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
}

/* Sections */
.section {
    margin-bottom: 16px;
    animation: fadeInUp 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
    animation-delay: 0.1s;
    animation-fill-mode: both;
    align-self: center;
    text-align: left;
}

.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 1.25rem;
    font-weight: 400;
    line-height: 1.75rem;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    transition: color 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
    padding: 8px;
    border-radius: var(--md-sys-shape-corner-small);
}

.section-header:hover {
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-primary);
}

.section-arrow {
    margin-left: 12px;
    color: var(--md-sys-color-on-surface-variant);
    transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
    font-size: 1.25rem;
}

.section-header:hover .section-arrow {
    color: var(--md-sys-color-primary);
    transform: rotate(180deg);
}

.content-box {
    background-color: var(--md-sys-color-surface-container-low);
    border-radius: var(--md-sys-shape-corner-large);
    padding: 24px;
    border: 1px solid var(--md-sys-color-outline-variant);
}

.search-terms {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.search-term {
    color: var(--md-sys-color-on-surface);
    padding: 16px;
    background-color: var(--md-sys-color-surface-container);
    border-radius: var(--md-sys-shape-corner-medium);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
    border: 1px solid var(--md-sys-color-outline-variant);
    font-weight: 400;
    font-size: 0.875rem;
    line-height: 1.25rem;
    letter-spacing: 0.25px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-term:hover {
    background-color: var(--md-sys-color-surface-container-high);
    border-color: var(--md-sys-color-outline);
    box-shadow: var(--md-sys-elevation-level1);
}

.related-works-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

.related-work-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background-color: var(--md-sys-color-surface-container);
    border-radius: var(--md-sys-shape-corner-extra-large);
    text-decoration: none;
    color: var(--md-sys-color-on-surface-variant);
    border: 1px solid var(--md-sys-color-outline-variant);
    transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
    overflow: hidden;
}

.related-work-chip:hover {
    background-color: var(--md-sys-color-surface-container-high);
    border-color: var(--md-sys-color-primary);
    transform: translateY(-2px);
    box-shadow: var(--md-sys-elevation-level1);
}

.relation-type-badge {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: var(--md-sys-shape-corner-medium);
    background-color: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
    flex-shrink: 0;
}

.relation-title {
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--md-sys-color-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

a {
    text-decoration: none;
    background-color: transparent;
    color: inherit; 
}

/* Material Icons */
.material-symbols-outlined {
    font-size: 1.25rem;
    vertical-align: middle;
}

/* Copyright Section */
.copyright-section {
    background-color: var(--md-sys-color-surface-container-low);
    border-radius: var(--md-sys-shape-corner-large);
    padding: 24px;
    margin-bottom: 32px;
    border: 1px solid var(--md-sys-color-outline-variant);
}

.copyright-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
}

.copyright-status {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-radius: var(--md-sys-shape-corner-medium);
    border: 2px solid;
    transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
}

.copyright-status.authorized {
    background-color: rgba(76, 175, 80, 0.1);
    border-color: #4CAF50;
    color: #2E7D32;
}

.copyright-status.license {
    background-color: rgba(255, 193, 7, 0.1);
    border-color: #FFC107;
    color: #F57F17;
}

.copyright-status.unclear {
    background-color: rgba(158, 158, 158, 0.1);
    border-color: #9E9E9E;
    color: #bebebe;
}

.copyright-icon {
    font-size: 24px;
}

.copyright-text {
    flex: 1;
}

.copyright-text h4 {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 4px;
}

.copyright-text p {
    font-size: 0.875rem;
    opacity: 0.8;
    line-height: 1.4;
}

.info-icon {
    position: relative;
    display: inline-flex;
    cursor: pointer;
}

.info-icon .material-symbols-outlined {
    color: #938f99;
    font-size: 22px;
    transition: color 0.2s ease;
}

.info-icon:hover .material-symbols-outlined {
    color: #d0bcff;
}

.tooltip {
    position: absolute;
    top: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);
    background: #e8def8;
    color: #1d192b;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    width: 260px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 10;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
    pointer-events: none;
    text-align: left;
    line-height: 1.5;
}

.info-icon:hover .tooltip {
    opacity: 1;
    visibility: visible;
}

.tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: transparent transparent #e8def8 transparent;
}

/* Footer */
.site-footer {
    text-align: center;
    padding: 24px 16px;
    margin-top: 32px;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.9rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    width: 100%;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}

.footer-content {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
}

.footer-links {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
}

.footer-links a {
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-links a:hover {
    text-decoration: underline;
}

.footer-social {
    display: flex;
    gap: 24px;
}

.footer-social a {
    font-size: 1.4rem;
    transition: color 0.3s ease, transform 0.3s ease;
    display: inline-block;
}

.footer-social a:hover {
    transform: translateY(-2px);
}

.footer-copyright p {
    margin: 0;
    font-size: 0.85rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    body {
        padding: 16px;
    }
    
    .player-container {
        padding: 24px;
    }
    
    .work-title {
        font-size: 2rem;
        line-height: 2.5rem;
    }
    
    .versions-container {
        flex-direction: column;
    }
    
    .version-card {
        min-width: auto;
    }
    
    .asset-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
}

/* Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(16px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Work Header Meta (Tags and Categories) */
.work-meta {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.work-meta-tags, .work-meta-categories {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 0.9rem;
}

.work-meta-tags i, .work-meta-categories i {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 1rem;
    margin-top: 2px;
    flex-shrink: 0;
}

.meta-label {
    color: var(--md-sys-color-on-surface-variant);
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
}

.tags-container, .categories-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.tag-chip.clickable, .category-chip.clickable {
    background: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
    border: none;
    text-decoration: none;
}

.tag-chip.clickable:hover, .category-chip.clickable:hover {
    background: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
    transform: translateY(-2px);
    box-shadow: var(--md-sys-elevation-level1);
}

.tags-expand {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.8rem;
    font-style: italic;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 12px;
    transition: all 0.3s ease;
}

.tags-expand:hover {
    background: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
}

.category-separator {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.8rem;
    opacity: 0.7;
}

/* Responsive adjustments for meta section */
@media (max-width: 768px) {
    .work-meta-tags, .work-meta-categories {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    .tags-container, .categories-container {
        width: 100%;
    }
}
`