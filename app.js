document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        theme: 'charcoal-gold',
        logoUrl: 'logonew.png',
        logoText: 'MY RESTAURANT',
        logoFilter: 'none',
        logoSize: 28,
        qrSize: 38,
        qrSourceMode: 'url', // 'url' or 'upload'
        qrImageUrl: null,
        paperSize: 'A5',
        scaleFactor: 1.0,
        headingMain: 'Become Our Member',
        headingSub: 'Scan the QR Code to Register & Enjoy Exclusive Benefits',
        description: 'Join our membership program to earn rewards, receive exclusive offers, special discounts, birthday surprises, and member-only promotions. Registration takes less than a minute.',
        qrUrl: 'https://example.com/register',
        scanText: 'Scan Here to Register',
        benefits: [
            { icon: '🎁', title: 'Exclusive Offers', desc: 'Sleek rewards just for you' },
            { icon: '💰', title: 'Member Discounts', desc: 'Up to 15% off menu items' }
        ],
        footerText: 'Thank You for Joining Our Membership Program',
        previewScale: 1.0
    };

    // DOM Elements
    const elements = {
        standBoard: document.getElementById('stand-board'),
        qrcodeContainer: document.getElementById('qrcode'),
        printBtn: document.getElementById('print-btn'),
        logoInput: document.getElementById('logo-upload'),
        logoFilterCtrl: document.getElementById('logo-filter-ctrl'),
        logoSizeCtrl: document.getElementById('logo-size-ctrl'),
        logoTextCtrl: document.getElementById('logo-text-ctrl'),
        headingMainCtrl: document.getElementById('heading-main-ctrl'),
        headingSubCtrl: document.getElementById('heading-sub-ctrl'),
        descCtrl: document.getElementById('desc-ctrl'),
        qrSourceModeCtrl: document.getElementById('qr-source-mode'),
        qrUrlContainer: document.getElementById('qr-url-container'),
        qrUploadContainer: document.getElementById('qr-upload-container'),
        qrUrlCtrl: document.getElementById('qr-url-ctrl'),
        qrUploadCtrl: document.getElementById('qr-upload'),
        qrSizeCtrl: document.getElementById('qr-size-ctrl'),
        scanTextCtrl: document.getElementById('scan-text-ctrl'),
        footerTextCtrl: document.getElementById('footer-text-ctrl'),
        zoomInBtn: document.getElementById('zoom-in'),
        zoomOutBtn: document.getElementById('zoom-out'),
        zoomVal: document.getElementById('zoom-val'),
        logoContainer: document.querySelector('.logo-container'),
        paperSizeCtrl: document.getElementById('paper-size-ctrl')
    };

    // Paper size configuration mapping
    const paperSizes = {
        'A4': { width: '210mm', height: '297mm' },
        'A5': { width: '148mm', height: '210mm' },
        'A6': { width: '105mm', height: '148mm' },
        'A7': { width: '74mm', height: '105mm' }
    };

    function updateLogoSize() {
        if (elements.logoContainer) {
            elements.logoContainer.style.height = `${state.logoSize * state.scaleFactor}mm`;
        }
    }

    function updatePaperSize() {
        const sizeData = paperSizes[state.paperSize];
        if (sizeData) {
            const scaleFactor = parseFloat(sizeData.width) / 148.0;
            state.scaleFactor = scaleFactor;
            document.documentElement.style.setProperty('--print-scale-factor', scaleFactor);
            
            document.documentElement.style.setProperty('--paper-width', sizeData.width);
            document.documentElement.style.setProperty('--paper-height', sizeData.height);
            
            // Adjust logo height and QR size based on scale factor
            updateLogoSize();
            generateQR();
            
            // Dynamic page rule adjustment for printing
            let pageStyleEl = document.getElementById('dynamic-page-print-style');
            if (!pageStyleEl) {
                pageStyleEl = document.createElement('style');
                pageStyleEl.id = 'dynamic-page-print-style';
                document.head.appendChild(pageStyleEl);
            }
            pageStyleEl.textContent = `@media print { @page { size: ${state.paperSize} portrait; margin: 0; } }`;
        }
    }

    if (elements.paperSizeCtrl) {
        elements.paperSizeCtrl.value = state.paperSize;
        elements.paperSizeCtrl.addEventListener('change', (e) => {
            state.paperSize = e.target.value;
            updatePaperSize();
        });
    }

    // Theme selector click handlers
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const theme = e.target.dataset.theme;
            elements.standBoard.className = `stand-board-a5 theme-${theme}`;
            state.theme = theme;
        });
    });

    // Logo image upload logic
    elements.logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                state.logoUrl = event.target.result;
                updateLogoPreview();
            };
            reader.readAsDataURL(file);
        }
    });

    // Clear logo button logic
    const clearLogoBtn = document.getElementById('clear-logo-btn');
    if (clearLogoBtn) {
        clearLogoBtn.addEventListener('click', () => {
            elements.logoInput.value = '';
            state.logoUrl = null;
            updateLogoPreview();
        });
    }

    function updateLogoPreview() {
        const logoImgEl = document.getElementById('logo-img-preview');
        if (state.logoUrl) {
            logoImgEl.src = state.logoUrl;
            logoImgEl.style.display = 'block';
            logoImgEl.className = `logo-img filter-${state.logoFilter}`;
            document.getElementById('logo-text-preview').style.display = 'none';
        } else {
            logoImgEl.style.display = 'none';
            document.getElementById('logo-text-preview').textContent = state.logoText || 'LOGO';
            document.getElementById('logo-text-preview').style.display = 'block';
        }
    }

    // Set fallback if logo fails to load (e.g. logonew.png does not exist initially)
    const logoImgEl = document.getElementById('logo-img-preview');
    logoImgEl.onerror = () => {
        state.logoUrl = null;
        updateLogoPreview();
    };

    // Bind logo filter select
    if (elements.logoFilterCtrl) {
        elements.logoFilterCtrl.value = state.logoFilter;
        elements.logoFilterCtrl.addEventListener('change', (e) => {
            state.logoFilter = e.target.value;
            updateLogoPreview();
        });
    }

    // Bind logo size slider
    if (elements.logoSizeCtrl) {
        elements.logoSizeCtrl.value = state.logoSize;
        elements.logoSizeCtrl.addEventListener('input', (e) => {
            state.logoSize = e.target.value;
            updateLogoSize();
        });
        // Set initial height
        updateLogoSize();
    }

    // Auto-update controls listeners
    const bindControl = (ctrl, stateKey, elementId, property = 'textContent') => {
        if (ctrl) {
            ctrl.value = state[stateKey];
            ctrl.addEventListener('input', (e) => {
                state[stateKey] = e.target.value;
                const displayEl = document.getElementById(elementId);
                if (displayEl) {
                    displayEl[property] = e.target.value;
                }
                if (stateKey === 'logoText' && !state.logoUrl) {
                    updateLogoPreview();
                }
            });
        }
    };

    bindControl(elements.logoTextCtrl, 'logoText', 'logo-text-preview');
    bindControl(elements.headingMainCtrl, 'headingMain', 'heading-main-preview');
    bindControl(elements.headingSubCtrl, 'headingSub', 'heading-sub-preview');
    bindControl(elements.descCtrl, 'description', 'desc-preview');
    bindControl(elements.scanTextCtrl, 'scanText', 'scan-text-preview');
    bindControl(elements.footerTextCtrl, 'footerText', 'footer-text-preview');

    // Dynamic QR generation or Image Upload
    let qrcodeInstance = null;
    function generateQR() {
        elements.qrcodeContainer.innerHTML = '';
        const scaledSize = state.qrSize * state.scaleFactor;
        elements.qrcodeContainer.style.width = `${scaledSize}mm`;
        elements.qrcodeContainer.style.height = `${scaledSize}mm`;

        if (state.qrSourceMode === 'upload') {
            if (state.qrImageUrl) {
                const img = document.createElement('img');
                img.src = state.qrImageUrl;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                elements.qrcodeContainer.appendChild(img);
            } else {
                elements.qrcodeContainer.innerHTML = '<div style="font-size:0.6rem;color:#7c7267;text-align:center;padding:10px;font-family:inherit;">Upload QR Code Image</div>';
            }
        } else {
            const pxSize = Math.round(scaledSize * 3.78);
            if (typeof QRCode !== 'undefined') {
                qrcodeInstance = new QRCode(elements.qrcodeContainer, {
                    text: state.qrUrl,
                    width: pxSize,
                    height: pxSize,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                elements.qrcodeContainer.textContent = 'QR Code Loading...';
            }
        }
    }

    // Bind QR Source Mode Toggle
    if (elements.qrSourceModeCtrl) {
        elements.qrSourceModeCtrl.value = state.qrSourceMode;
        elements.qrSourceModeCtrl.addEventListener('change', (e) => {
            state.qrSourceMode = e.target.value;
            if (state.qrSourceMode === 'url') {
                elements.qrUrlContainer.style.display = 'block';
                elements.qrUploadContainer.style.display = 'none';
            } else {
                elements.qrUrlContainer.style.display = 'none';
                elements.qrUploadContainer.style.display = 'block';
            }
            generateQR();
        });
    }

    // Bind QR URL input to regenerate QR Code
    if (elements.qrUrlCtrl) {
        elements.qrUrlCtrl.value = state.qrUrl;
        elements.qrUrlCtrl.addEventListener('input', (e) => {
            state.qrUrl = e.target.value;
            generateQR();
        });
    }

    // Bind QR Upload file selection
    if (elements.qrUploadCtrl) {
        elements.qrUploadCtrl.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    state.qrImageUrl = event.target.result;
                    generateQR();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Bind QR size slider
    if (elements.qrSizeCtrl) {
        elements.qrSizeCtrl.value = state.qrSize;
        elements.qrSizeCtrl.addEventListener('input', (e) => {
            state.qrSize = e.target.value;
            generateQR();
        });
    }

    // Bind Benefit Control Rows
    const benefitControlsContainer = document.getElementById('benefit-controls');
    function renderBenefitInputs() {
        benefitControlsContainer.innerHTML = '';
        state.benefits.forEach((benefit, index) => {
            const row = document.createElement('div');
            row.className = 'benefit-input-row';
            
            const iconSelect = document.createElement('select');
            const iconsList = ['🎁', '⭐', '🎂', '💰', '🔥', '💎', '🔑', '☕', '🏷️', '📢'];
            iconsList.forEach(icon => {
                const opt = document.createElement('option');
                opt.value = icon;
                opt.textContent = icon;
                if (icon === benefit.icon) opt.selected = true;
                iconSelect.appendChild(opt);
            });

            const inputTitle = document.createElement('input');
            inputTitle.type = 'text';
            inputTitle.value = benefit.title;
            inputTitle.placeholder = 'Benefit Title';

            const inputDesc = document.createElement('input');
            inputDesc.type = 'text';
            inputDesc.value = benefit.desc;
            inputDesc.placeholder = 'Brief detail';

            row.appendChild(iconSelect);
            row.appendChild(inputTitle);
            row.appendChild(inputDesc);
            benefitControlsContainer.appendChild(row);

            // Listeners
            const updateCard = () => {
                benefit.icon = iconSelect.value;
                benefit.title = inputTitle.value;
                benefit.desc = inputDesc.value;
                updateBenefitCardDisplay(index);
            };

            iconSelect.addEventListener('change', updateCard);
            inputTitle.addEventListener('input', updateCard);
            inputDesc.addEventListener('input', updateCard);
        });
    }

    function updateBenefitCardDisplay(index) {
        const card = document.getElementById(`benefit-card-${index}`);
        if (card) {
            const benefit = state.benefits[index];
            card.querySelector('.benefit-icon').textContent = benefit.icon;
            card.querySelector('h4').textContent = benefit.title;
            card.querySelector('p').textContent = benefit.desc;
        }
    }

    // Zoom Functions
    function updateZoom() {
        document.documentElement.style.setProperty('--preview-scale', state.previewScale);
        elements.zoomVal.textContent = `${Math.round(state.previewScale * 100)}%`;
    }

    elements.zoomInBtn.addEventListener('click', () => {
        if (state.previewScale < 1.8) {
            state.previewScale += 0.1;
            updateZoom();
        }
    });

    elements.zoomOutBtn.addEventListener('click', () => {
        if (state.previewScale > 0.5) {
            state.previewScale -= 0.1;
            updateZoom();
        }
    });

    // Mobile Tab switching logic
    const tabEdit = document.getElementById('tab-edit');
    const tabPreview = document.getElementById('tab-preview');
    
    // Set initial body class to edit mode on mobile
    document.body.classList.add('show-edit');

    if (tabEdit && tabPreview) {
        tabEdit.addEventListener('click', () => {
            tabEdit.classList.add('active');
            tabPreview.classList.remove('active');
            document.body.classList.remove('show-preview');
            document.body.classList.add('show-edit');
        });

        tabPreview.addEventListener('click', () => {
            tabPreview.classList.add('active');
            tabEdit.classList.remove('active');
            document.body.classList.remove('show-edit');
            document.body.classList.add('show-preview');
        });
    }

    // Print button handler
    elements.printBtn.addEventListener('click', () => {
        window.print();
    });

    // Initialize
    updatePaperSize();
    updateLogoPreview();
    renderBenefitInputs();
    
    // Load QRCode library and generate the QR code
    if (typeof QRCode === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = () => {
            generateQR();
        };
        document.body.appendChild(script);
    } else {
        generateQR();
    }
});
