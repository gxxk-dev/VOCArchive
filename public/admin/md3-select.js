/**
 * Material Design 3 Select Enhancement
 * Provides floating label behavior and state management for MD3 select fields
 */

class MD3Select {
    constructor() {
        this.init();
    }

    init() {
        // Initialize existing MD3 select fields
        this.initializeExistingFields();
        
        // Set up mutation observer for dynamically added selects
        this.setupMutationObserver();
    }

    initializeExistingFields() {
        const selectFields = document.querySelectorAll('.md3-select-field');
        selectFields.forEach(field => this.enhanceSelectField(field));
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a select field
                        if (node.classList && node.classList.contains('md3-select-field')) {
                            this.enhanceSelectField(node);
                        }
                        // Check for select fields within the added node
                        const selectFields = node.querySelectorAll && node.querySelectorAll('.md3-select-field');
                        if (selectFields) {
                            selectFields.forEach(field => this.enhanceSelectField(field));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    enhanceSelectField(field) {
        const select = field.querySelector('select');
        if (!select) return;

        // Add state layer if not present
        this.ensureStateLayer(field);
        
        // Set up event listeners
        this.setupEventListeners(field, select);
        
        // Initial state check
        this.updateFieldState(field, select);
    }

    ensureStateLayer(field) {
        if (!field.querySelector('.md3-state-layer')) {
            const stateLayer = document.createElement('div');
            stateLayer.classList.add('md3-state-layer');
            field.appendChild(stateLayer);
        }
    }

    setupEventListeners(field, select) {
        // Prevent duplicate listeners
        if (select.hasAttribute('data-md3-enhanced')) return;
        select.setAttribute('data-md3-enhanced', 'true');

        // Handle value changes
        select.addEventListener('change', () => {
            this.updateFieldState(field, select);
        });

        // Handle focus events
        select.addEventListener('focus', () => {
            field.classList.add('focused');
        });

        select.addEventListener('blur', () => {
            field.classList.remove('focused');
            this.updateFieldState(field, select);
        });

        // Handle input events for better responsiveness
        select.addEventListener('input', () => {
            this.updateFieldState(field, select);
        });
    }

    updateFieldState(field, select) {
        const hasValue = select.value && select.value.trim() !== '';
        
        if (hasValue) {
            field.classList.add('has-value');
        } else {
            field.classList.remove('has-value');
        }

        // Update validation state if needed
        this.updateValidationState(field, select);
    }

    updateValidationState(field, select) {
        const isRequired = select.hasAttribute('required');
        const hasValue = select.value && select.value.trim() !== '';
        const isInvalid = isRequired && !hasValue && select.hasAttribute('data-touched');

        if (isInvalid) {
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    }

    // Utility method to convert regular select to MD3 select
    static convertToMD3(selectElement, labelText, helperText = '') {
        const wrapper = document.createElement('div');
        wrapper.classList.add('md3-select-field');

        // Create label
        const label = document.createElement('label');
        label.classList.add('md3-label');
        label.textContent = labelText;

        // Create state layer
        const stateLayer = document.createElement('div');
        stateLayer.classList.add('md3-state-layer');

        // Clone the select element
        const newSelect = selectElement.cloneNode(true);
        
        // Build the structure
        wrapper.appendChild(newSelect);
        wrapper.appendChild(label);
        wrapper.appendChild(stateLayer);

        // Add helper text if provided
        if (helperText) {
            const helper = document.createElement('div');
            helper.classList.add('md3-helper-text');
            helper.textContent = helperText;
            wrapper.appendChild(helper);
        }

        // Replace the original select
        selectElement.parentNode.replaceChild(wrapper, selectElement);

        // Initialize the new field
        const md3Instance = window.md3Select || new MD3Select();
        md3Instance.enhanceSelectField(wrapper);

        return wrapper;
    }

    // Method to create MD3 select from scratch
    static create(options = {}) {
        const {
            name = '',
            id = '',
            labelText = '',
            helperText = '',
            required = false,
            options: selectOptions = [],
            value = '',
            classes = []
        } = options;

        const wrapper = document.createElement('div');
        wrapper.classList.add('md3-select-field');
        if (classes.length > 0) {
            wrapper.classList.add(...classes);
        }

        // Create select element
        const select = document.createElement('select');
        if (name) select.name = name;
        if (id) select.id = id;
        if (required) select.required = true;

        // Add options
        selectOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value || option;
            optionElement.textContent = option.text || option;
            if (option.value === value || option === value) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });

        // Create label
        const label = document.createElement('label');
        label.classList.add('md3-label');
        label.textContent = labelText;
        if (id) label.setAttribute('for', id);

        // Create state layer
        const stateLayer = document.createElement('div');
        stateLayer.classList.add('md3-state-layer');

        // Build structure
        wrapper.appendChild(select);
        wrapper.appendChild(label);
        wrapper.appendChild(stateLayer);

        // Add helper text if provided
        if (helperText) {
            const helper = document.createElement('div');
            helper.classList.add('md3-helper-text');
            helper.textContent = helperText;
            wrapper.appendChild(helper);
        }

        // Initialize the field
        const md3Instance = window.md3Select || new MD3Select();
        md3Instance.enhanceSelectField(wrapper);

        return wrapper;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.md3Select = new MD3Select();
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MD3Select;
}