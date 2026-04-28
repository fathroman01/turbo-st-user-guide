import { initialData } from './data.js';

// --- KONFIGURASI FIREBASE ---
// Ganti dengan konfigurasi dari Firebase Console Anda!
const firebaseConfig = {
    apiKey: "AIzaSyCAHB2w_pIVkvwfKCxkMOVSFaRKTGu9JRo",
    authDomain: "turbo-st-docs.firebaseapp.com",
    databaseURL: "https://turbo-st-docs-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "turbo-st-docs",
    storageBucket: "turbo-st-docs.firebasestorage.app",
    messagingSenderId: "653814096123",
    appId: "1:653814096123:web:fef2df2361b928dbbe505e"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const DOC_ID = "turbo_st_documentation_data"; // ID Dokumen tunggal untuk menyimpan seluruh data

class DocApp {
    constructor() {
        this.data = null; // Akan diisi dari Cloud
        this.currentPageId = 'beranda';
        this.isAdminMode = false;

        // Elements
        this.navMenu = document.getElementById('nav-menu');
        this.pageTitle = document.getElementById('page-title');
        this.pageDesc = document.getElementById('page-description');
        this.pageContent = document.getElementById('page-content');
        this.breadcrumbApp = document.getElementById('breadcrumb-app');
        this.breadcrumb = document.getElementById('breadcrumb-current');
        this.btnToggleCMS = document.getElementById('toggle-cms');
        this.cmsActions = document.getElementById('cms-actions');
        this.btnSave = document.getElementById('btn-save-cms');
        this.btnCancelCMS = document.getElementById('btn-cancel-cms');
        this.btnLogoutCMS = document.getElementById('btn-logout-cms');
        this.btnAddH2 = document.getElementById('btn-add-h2');
        this.btnAddText = document.getElementById('btn-add-text');
        this.btnAddList = document.getElementById('btn-add-list');
        this.btnAddBullets = document.getElementById('btn-add-bullets');
        this.btnAddLink = document.getElementById('btn-add-link');
        this.btnAddImage = document.getElementById('btn-add-image');
        this.btnAddSuccess = document.getElementById('btn-add-success');
        this.btnAddCallout = document.getElementById('btn-add-callout');
        this.btnAddGreeting = document.getElementById('btn-add-greeting');
        this.btnAddGreetingBakoel = document.getElementById('btn-add-greeting-bakoel');
        this.btnAddPage = document.getElementById('btn-add-page');
        this.btnAddGroup = document.getElementById('btn-add-group');
        this.searchInput = document.getElementById('search-input');
        
        // Mobile Sidebar Elements
        this.sidebar = document.getElementById('sidebar');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');

        // Formatting Buttons
        this.btnBold = document.getElementById('btn-bold');
        this.btnItalic = document.getElementById('btn-italic');
        this.btnNormal = document.getElementById('btn-normal');

        // Modal Elements
        this.modalAddPage = document.getElementById('modal-add-page');
        this.btnConfirmAdd = document.getElementById('btn-confirm-add-page');
        this.btnCancelModal = document.getElementById('btn-cancel-modal');

        this.modalLink = document.getElementById('modal-link');
        this.btnConfirmLink = document.getElementById('btn-confirm-link');
        this.btnCancelLink = document.getElementById('btn-cancel-link');
        this.btnRemoveLink = document.getElementById('btn-remove-link');
        this.linkTargetSelect = document.getElementById('link-target-page');
        this.linkTargetHash = document.getElementById('link-target-hash');
        this.linkHashGroup = document.getElementById('group-link-hash');

        this.selectedRange = null;
        this.editingLink = null;

        // Pagination & TOC
        this.navPrev = document.getElementById('nav-prev');
        this.navNext = document.getElementById('nav-next');
        this.tocList = document.getElementById('toc-list');

        // History for Undo/Redo
        this.history = [];
        this.redoStack = [];

        this.init();
    }

    async init() {
        console.log("Menghubungkan ke Cloud Firestore...");
        this.data = await this.loadData();

        if (this.data) {
            this.renderNav();
            this.renderPage(this.currentPageId);
            this.setupEventListeners();
            lucide.createIcons();
            console.log("Data berhasil dimuat dari Cloud!");
            
            // Check admin session
            if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
                this.enableAdminMode();
            }
        } else {
            console.error("Gagal memuat data. Periksa konfigurasi Firebase Anda.");
            alert("Gagal terhubung ke Cloud. Pastikan API Key sudah benar.");
        }
    }

    async loadData() {
        try {
            const doc = await db.collection('documentation').doc(DOC_ID).get();
            if (doc.exists) {
                return doc.data();
            } else {
                console.log("Database Cloud kosong, menggunakan data awal...");
                // Simpan data awal ke cloud jika belum ada
                await this.saveData(initialData, false);
                return initialData;
            }
        } catch (error) {
            console.error("Error loading data from Firestore:", error);
            // Fallback ke localStorage jika cloud gagal agar tetap bisa jalan
            const saved = localStorage.getItem('turbo_st_docs');
            return saved ? JSON.parse(saved) : initialData;
        }
    }

    async saveData(newData = null, showMessage = true) {
        const dataToSave = newData || this.data;
        
        // Visual indicator
        const originalText = this.btnSave.innerHTML;
        this.btnSave.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width:14px"></i> Menyimpan...';
        this.btnSave.disabled = true;

        try {
            console.log("Mencoba menyimpan data ke Firestore...");
            await db.collection('documentation').doc(DOC_ID).set(dataToSave);
            console.log("Berhasil disimpan ke Firestore!");

            if (showMessage) {
                alert('Perubahan berhasil disimpan ke Cloud!');
                this.history = []; 
                this.redoStack = [];
            }

            localStorage.setItem('turbo_st_docs', JSON.stringify(dataToSave));
        } catch (error) {
            console.error("Gagal menyimpan ke Firestore:", error);
            alert('Gagal menyimpan ke Cloud! Periksa koneksi atau izin database Anda.');
            localStorage.setItem('turbo_st_docs', JSON.stringify(dataToSave));
        } finally {
            this.btnSave.innerHTML = originalText;
            this.btnSave.disabled = false;
            lucide.createIcons();
        }
    }

    renderNav() {
        this.navMenu.innerHTML = '';
        this.data.apps.forEach(app => {
            const group = document.createElement('div');
            group.className = 'nav-group';
            if (this.isAdminMode) {
                group.addEventListener('dragstart', (e) => this.handleDragStart(e, null, app.id, 'group'));
                group.addEventListener('dragover', (e) => this.handleDragOver(e));
                group.addEventListener('drop', (e) => this.handleDrop(e, null, app.id, 'group'));
                group.addEventListener('dragenter', (e) => this.handleDragEnter(e));
                group.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            }
            group.innerHTML = `
                <div class="nav-group-title" data-group-id="${app.id}">
                    <div class="group-title-left" style="display: flex; align-items: center; gap: 0.75rem;">
                        ${this.isAdminMode ? `
                            <span class="group-drag-handle" title="Geser urutan grup" style="cursor: grab; color: var(--text-muted); display: inline-flex; align-items: center;">
                                <i data-lucide="grip-vertical" style="width: 16px;"></i>
                            </span>
                        ` : ''}
                        <span class="group-icon-wrapper ${this.isAdminMode ? 'editable-icon' : ''}" title="${this.isAdminMode ? 'Klik untuk ganti ikon' : ''}">
                            <i data-lucide="${app.icon || 'layout'}" style="width: 18px;"></i>
                        </span>
                        <span ${this.isAdminMode ? 'contenteditable="true"' : ''}>${app.name}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${this.isAdminMode ? `
                            <button class="btn-delete-group" data-delete-group="${app.id}" title="Hapus Seluruh Grup">
                                <i data-lucide="trash-2" style="width: 14px;"></i>
                            </button>
                        ` : ''}
                        <i data-lucide="chevron-down" style="width: 14px;"></i>
                    </div>
                </div>
                <ul class="nav-menu"></ul>
            `;

            if (this.isAdminMode) {
                const iconWrapper = group.querySelector('.group-icon-wrapper');
                iconWrapper.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentIcon = app.icon || 'layout';
                    const newIcon = prompt('Masukkan nama ikon Lucide untuk Grup ini (contoh: zap, box, shopping-bag, database):', currentIcon);
                    if (newIcon) {
                        app.icon = newIcon;
                        this.saveData();
                        this.renderNav();
                    }
                });

                const btnDeleteGroup = group.querySelector('.btn-delete-group');
                if (btnDeleteGroup) {
                    btnDeleteGroup.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteGroup(app.id, app.name);
                    });
                }
            }

            group.querySelector('.nav-group-title').addEventListener('click', (e) => {
                if (this.isAdminMode && (e.target.tagName === 'SPAN' || e.target.closest('.group-icon-wrapper') || e.target.closest('.btn-delete-group'))) {
                    return;
                }

                const isCollapsed = group.classList.contains('collapsed');
                if (isCollapsed) {
                    // Tutup grup lain (Accordion)
                    document.querySelectorAll('.nav-group').forEach(otherGroup => {
                        otherGroup.classList.add('collapsed');
                    });
                    group.classList.remove('collapsed');
                } else {
                    group.classList.add('collapsed');
                }
            });

            if (this.isAdminMode) {
                const dragHandle = group.querySelector('.group-drag-handle');
                if (dragHandle) {
                    dragHandle.addEventListener('mouseenter', () => group.draggable = true);
                    dragHandle.addEventListener('mouseleave', () => group.draggable = false);
                }
                const titleSpan = group.querySelector('.nav-group-title span[contenteditable="true"]') || group.querySelector('.nav-group-title span:last-child');
                if (titleSpan) {
                    titleSpan.addEventListener('blur', (e) => {
                        group.draggable = false;
                        app.name = e.target.innerText;
                        this.saveData();
                    });
                }
            }

            const list = group.querySelector('ul');
            app.pages.forEach(page => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                if (this.isAdminMode) {
                    li.addEventListener('dragstart', (e) => this.handleDragStart(e, page.id, app.id, 'page'));
                    li.addEventListener('dragover', (e) => this.handleDragOver(e));
                    li.addEventListener('drop', (e) => this.handleDrop(e, page.id, app.id, 'page'));
                    li.addEventListener('dragenter', (e) => this.handleDragEnter(e));
                    li.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                }
                const isHome = page.id === 'beranda';

                const temp = document.createElement('div');
                temp.innerHTML = page.content;
                const headings = temp.querySelectorAll('h2');
                const hasSubMenu = headings.length > 0;

                li.innerHTML = `
                    <div class="nav-item-header">
                        <a href="#" class="nav-link ${page.id === this.currentPageId ? 'active' : ''}" data-id="${page.id}" style="display: flex; align-items: center;">
                            ${this.isAdminMode && !isHome ? `
                                <span class="page-drag-handle" title="Geser urutan bab" style="cursor: grab; color: var(--text-muted); margin-right: 6px; display: inline-flex; align-items: center;">
                                    <i data-lucide="grip-vertical" style="width: 14px;"></i>
                                </span>
                            ` : ''}
                            <span class="nav-text" ${this.isAdminMode ? 'contenteditable="true"' : ''}>${page.title}</span>
                            ${this.isAdminMode && !isHome ? `
                                <button class="btn-delete-page" data-delete="${page.id}" title="Hapus Bab">
                                    <i data-lucide="x" style="width: 14px;"></i>
                                </button>
                            ` : ''}
                        </a>
                        ${hasSubMenu ? `
                            <button class="btn-toggle-sub ${page.id === this.currentPageId ? 'open' : ''}" title="Tampilkan/Sembunyikan Sub-bab">
                                <i data-lucide="chevron-right" style="width: 14px;"></i>
                            </button>
                        ` : ''}
                    </div>
                `;

                if (this.isAdminMode) {
                    const dragHandle = li.querySelector('.page-drag-handle');
                    if (dragHandle) {
                        dragHandle.addEventListener('mouseenter', () => li.draggable = true);
                        dragHandle.addEventListener('mouseleave', () => li.draggable = false);
                    }
                    const textSpan = li.querySelector('.nav-text');
                    if (textSpan) {
                        textSpan.addEventListener('blur', () => {
                            li.draggable = false;
                            page.title = textSpan.innerText;
                            this.saveData();
                        });
                    }
                }

                li.querySelector('.nav-link').addEventListener('click', (e) => {
                    const btnDelete = e.target.closest('.btn-delete-page');
                    if (btnDelete) {
                        e.stopPropagation();
                        this.deletePage(page.id, app.id);
                        return;
                    }
                    if (this.isAdminMode && e.target.classList.contains('nav-text')) return;
                    e.preventDefault();
                    this.navigateTo(page.id);
                });

                if (hasSubMenu) {
                    const subMenu = document.createElement('ul');
                    subMenu.className = 'sub-menu';
                    if (page.id !== this.currentPageId) subMenu.classList.add('collapsed');

                    headings.forEach((h, i) => {
                        const subLi = document.createElement('li');
                        subLi.className = 'sub-item';
                        subLi.innerHTML = `<a href="#" class="sub-link" data-hash="heading-${i}">${h.innerText}</a>`;
                        subLi.querySelector('a').addEventListener('click', (e) => {
                            e.preventDefault();
                            this.navigateTo(page.id, `heading-${i}`);
                        });
                        subMenu.appendChild(subLi);
                    });

                    const btnToggle = li.querySelector('.btn-toggle-sub');
                    btnToggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        subMenu.classList.toggle('collapsed');
                        btnToggle.classList.toggle('open');
                    });

                    li.appendChild(subMenu);
                }
                list.appendChild(li);
            });
            this.navMenu.appendChild(group);
        });
        lucide.createIcons();
    }

    handleDragStart(e, pageId, appId, type) {
        if (e.target.tagName === 'INPUT' || e.target.contentEditable === "true" || e.target.closest('.btn-delete-page') || e.target.closest('.btn-delete-group')) {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        this.draggedItem = { pageId, appId, type };
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            if (e.target.classList) e.target.classList.add('dragging');
        }, 0);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.classList) e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.stopPropagation();
        if (e.currentTarget.classList) e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e, targetPageId, targetAppId, targetType) {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.classList) e.currentTarget.classList.remove('drag-over');
        
        if (!this.draggedItem) return;

        const { pageId: sourcePageId, appId: sourceAppId, type: sourceType } = this.draggedItem;
        this.draggedItem = null;

        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));

        if (sourceType === 'page' && targetType === 'page') {
            if (sourcePageId === targetPageId) return;

            const sourceAppIndex = this.data.apps.findIndex(a => a.id === sourceAppId);
            const targetAppIndex = this.data.apps.findIndex(a => a.id === targetAppId);
            
            const sourceApp = this.data.apps[sourceAppIndex];
            const targetApp = this.data.apps[targetAppIndex];

            const sourcePageIndex = sourceApp.pages.findIndex(p => p.id === sourcePageId);
            const targetPageIndex = targetApp.pages.findIndex(p => p.id === targetPageId);

            const [page] = sourceApp.pages.splice(sourcePageIndex, 1);
            targetApp.pages.splice(targetPageIndex, 0, page);

            this.takeSnapshot();
            this.saveData();
            this.renderNav();
        } else if (sourceType === 'group' && targetType === 'group') {
            if (sourceAppId === targetAppId) return;

            const sourceAppIndex = this.data.apps.findIndex(a => a.id === sourceAppId);
            const targetAppIndex = this.data.apps.findIndex(a => a.id === targetAppId);

            const [app] = this.data.apps.splice(sourceAppIndex, 1);
            this.data.apps.splice(targetAppIndex, 0, app);

            this.takeSnapshot();
            this.saveData();
            this.renderNav();
        }
    }

    renderPage(id) {
        let page = null;
        let currentApp = null;
        this.data.apps.forEach(app => {
            const found = app.pages.find(p => p.id === id);
            if (found) {
                page = found;
                currentApp = app;
            }
        });

        if (!page) return;

        this.currentPageId = id;
        this.pageTitle.innerText = page.title;
        this.pageDesc.innerText = page.description;
        this.pageContent.innerHTML = page.content;

        this.breadcrumbApp.innerText = currentApp.name;
        this.breadcrumbApp.onclick = (e) => {
            e.preventDefault();
            this.navigateTo(currentApp.pages[0].id);
        };
        this.breadcrumb.innerText = page.title;

        this.renderTOC();
        this.renderPagination();

        if (this.isAdminMode) {
            this.injectAdminTools();
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.id === id);
        });

        const article = document.querySelector('article');
        article.classList.remove('animate-fade');
        void article.offsetWidth;
        article.classList.add('animate-fade');
    }

    navigateTo(id, hash = null) {
        if (this.isAdminMode) {
            this.updateCurrentPageData();
            this.takeSnapshot();
        }
        this.renderPage(id);

        if (window.innerWidth <= 768) {
            this.closeSidebar();
        }

        if (!hash) {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }

        if (hash) {
            setTimeout(() => {
                const el = document.getElementById(hash);
                if (el) {
                    const headerOffset = 80;
                    const elementPosition = el.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                    el.style.backgroundColor = 'var(--primary-light)';
                    setTimeout(() => el.style.backgroundColor = '', 1000);
                }
            }, 300);
        }
    }

    setupEventListeners() {
        if (this.btnToggleCMS) {
            this.btnToggleCMS.addEventListener('click', () => this.toggleAdminMode());
        }
        this.btnSave.addEventListener('click', async () => {
            this.updateCurrentPageData();
            await this.saveData();
            // Just save, keep admin mode active
            alert("Perubahan disimpan!");
        });

        if (this.btnCancelCMS) {
            this.btnCancelCMS.addEventListener('click', () => this.cancelEdit());
        }

        if (this.btnLogoutCMS) {
            this.btnLogoutCMS.addEventListener('click', () => {
                sessionStorage.removeItem('isAdminLoggedIn');
                window.location.reload();
            });
        }

        // Prevent focus loss when clicking toolbar buttons
        this.cmsActions.addEventListener('mousedown', (e) => {
            if (e.target.closest('.btn')) {
                e.preventDefault();
            }
        });

        this.btnAddH2.addEventListener('click', () => this.insertH2Block());
        this.btnAddText.addEventListener('click', () => this.insertTextBlock());
        this.btnAddList.addEventListener('click', () => this.insertListBlock());
        this.btnAddBullets.addEventListener('click', () => this.insertBulletBlock());
        this.btnAddLink.addEventListener('click', () => this.showLinkModal());
        this.btnAddImage.addEventListener('click', () => this.insertImagePlaceholder());
        this.btnAddSuccess.addEventListener('click', () => this.insertSuccessBlock());
        this.btnAddCallout.addEventListener('click', () => this.insertCalloutBlock());
        if (this.btnAddGreeting) {
            this.btnAddGreeting.addEventListener('click', () => this.insertGreetingBlock());
        }
        if (this.btnAddGreetingBakoel) {
            this.btnAddGreetingBakoel.addEventListener('click', () => this.insertGreetingBakoelBlock());
        }
        this.btnAddPage.addEventListener('click', () => this.showModal());
        this.btnAddGroup.addEventListener('click', () => this.addGroup());
        this.btnCancelModal.addEventListener('click', () => this.hideModal());
        this.btnConfirmAdd.addEventListener('click', () => this.addNewPage());

        this.btnUndo = document.getElementById('btn-undo');
        this.btnRedo = document.getElementById('btn-redo');

        this.btnUndo.addEventListener('click', (e) => { e.preventDefault(); this.undo(); });
        this.btnRedo.addEventListener('click', (e) => { e.preventDefault(); this.redo(); });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isAdminMode) return;
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
                e.preventDefault();
                this.redo();
            }
        });

        // Mobile Sidebar Toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        }
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        }

        // Formatting event listeners
        this.btnBold.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('bold', false, null);
        });
        this.btnItalic.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('italic', false, null);
        });
        this.btnNormal.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('removeFormat', false, null);
        });

        this.btnCancelLink.addEventListener('click', () => this.hideLinkModal());
        this.btnConfirmLink.addEventListener('click', () => this.applyInternalLink());
        this.btnRemoveLink.addEventListener('click', () => this.removeInternalLink());

        this.linkTargetSelect.addEventListener('change', () => this.updateLinkModalHashes());

        // Import/Export
        document.getElementById('btn-export').addEventListener('click', () => this.exportData());
        document.getElementById('btn-import').addEventListener('click', () => this.triggerImport());

        this.navPrev.addEventListener('click', (e) => {
            e.preventDefault();
            const allPages = this.getAllPages();
            const idx = allPages.findIndex(p => p.id === this.currentPageId);
            if (idx > 0) this.navigateTo(allPages[idx - 1].id);
        });

        this.navNext.addEventListener('click', (e) => {
            e.preventDefault();
            const allPages = this.getAllPages();
            const idx = allPages.findIndex(p => p.id === this.currentPageId);
            if (idx < allPages.length - 1) this.navigateTo(allPages[idx + 1].id);
        });

        this.pageContent.addEventListener('click', (e) => {
            const internalLink = e.target.closest('.internal-link');
            if (internalLink) {
                e.preventDefault();
                if (this.isAdminMode) {
                    this.showLinkModal(internalLink);
                } else {
                    this.navigateTo(internalLink.dataset.id, internalLink.dataset.hash);
                }
                return;
            }

            if (!this.isAdminMode) return;
            if (e.target.tagName === 'IMG' || e.target.closest('.img-placeholder')) {
                this.triggerImageUpload(e.target.closest('.img-container') || e.target);
                return;
            }
            const btnDelete = e.target.closest('.btn-delete');
            if (btnDelete) {
                const block = btnDelete.closest('.img-container, .callout');
                if (block && confirm('Hapus bagian ini?')) {
                    block.remove();
                    this.renderTOC();
                }
            }
        });

        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length > 2) {
                this.search(query);
            } else {
                this.renderNav();
            }
        });

        const pasteHandler = (e) => {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        };

        this.pageTitle.addEventListener('paste', pasteHandler);
        this.pageDesc.addEventListener('paste', pasteHandler);
        this.pageContent.addEventListener('paste', pasteHandler);
        const logoText = document.querySelector('.logo-text');
        if (logoText) logoText.addEventListener('paste', pasteHandler);

        // Track selection
        this.pageContent.addEventListener('mouseup', () => this.saveSelection());
        this.pageContent.addEventListener('keyup', () => this.saveSelection());
        this.pageContent.addEventListener('blur', () => this.saveSelection());
    }

    saveSelection() {
        const sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            const range = sel.getRangeAt(0);
            if (this.pageContent.contains(range.commonAncestorContainer)) {
                this.selectedRange = range;
            }
        }
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
        this.sidebarOverlay.classList.toggle('show');
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.sidebarOverlay.classList.remove('show');
    }

    async deleteGroup(id, name) {
        if (confirm(`Apakah Anda yakin ingin menghapus seluruh grup "${name}" beserta isinya?`)) {
            this.takeSnapshot();
            this.data.apps = this.data.apps.filter(app => app.id !== id);
            await this.saveData();

            let pageExists = false;
            this.data.apps.forEach(app => {
                if (app.pages.find(p => p.id === this.currentPageId)) pageExists = true;
            });

            if (!pageExists && this.data.apps.length > 0) {
                this.navigateTo(this.data.apps[0].pages[0].id);
            } else {
                this.renderNav();
            }
        }
    }

    addGroup() {
        const name = prompt('Masukkan Nama Aplikasi/Grup Baru:', 'Aplikasi Baru');
        if (name) {
            this.takeSnapshot();
            const id = name.toLowerCase().replace(/\s+/g, '-');
            const newApp = {
                id: id + '-' + Date.now(),
                name: name,
                icon: 'layout',
                pages: [
                    {
                        id: 'home-' + Date.now(),
                        title: 'Beranda ' + name,
                        description: 'Selamat datang di grup ' + name,
                        content: '<p>Mulai tulis panduan Anda di sini...</p>'
                    }
                ]
            };
            this.data.apps.push(newApp);
            this.renderNav();
            this.saveData();
        }
    }

    async deletePage(id, appId) {
        if (confirm('Apakah Anda yakin ingin menghapus bab ini?')) {
            const app = this.data.apps.find(a => a.id === appId);
            if (app) {
                this.takeSnapshot();
                app.pages = app.pages.filter(p => p.id !== id);
                await this.saveData();
                if (this.currentPageId === id) {
                    this.navigateTo(app.pages[0]?.id || 'beranda');
                } else {
                    this.renderNav();
                }
            }
        }
    }

    addNewPage() {
        const titleInput = document.getElementById('new-page-title');
        const iconInput = document.getElementById('new-page-icon');
        const title = titleInput.value.trim();
        const icon = iconInput.value.trim() || 'file-text';

        if (!title) {
            alert('Judul bab harus diisi!');
            return;
        }

        const id = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        const newPage = {
            id: id,
            title: title,
            icon: icon,
            description: 'Panduan mengenai ' + title,
            content: '<p>Tulis konten bab baru di sini...</p>'
        };

        this.takeSnapshot();
        const activeApp = this.data.apps[0]; // Tambahkan ke aplikasi pertama secara default atau yang sedang dibuka
        activeApp.pages.push(newPage);

        this.saveData();
        this.hideModal();
        this.renderNav();
        this.navigateTo(id);
    }

    enableAdminMode() {
        this.isAdminMode = true;
        document.body.classList.add('admin-mode');
        this.cmsActions.style.display = 'block';

        const isEditable = 'true';
        this.pageTitle.contentEditable = isEditable;
        this.pageDesc.contentEditable = isEditable;
        this.pageContent.contentEditable = isEditable;

        const logoText = document.querySelector('.logo-text');
        if (logoText) logoText.contentEditable = isEditable;

        this.renderNav();
        this.renderPage(this.currentPageId);
        lucide.createIcons();
    }

    insertAtCursor(element) {
        this.takeSnapshot();

        if (this.selectedRange) {
            const range = this.selectedRange;
            range.deleteContents();
            range.insertNode(element);

            const nextP = document.createElement('p');
            nextP.innerHTML = '<br>';
            element.after(nextP);

            const newRange = document.createRange();
            newRange.setStart(nextP, 0);
            newRange.collapse(true);

            this.selectedRange = newRange;
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(newRange);
        } else {
            this.pageContent.appendChild(element);
        }
    }

    insertH2Block() {
        const h2 = document.createElement('h2');
        h2.innerText = 'Sub Judul Baru';
        this.insertAtCursor(h2);
        this.renderTOC();
    }

    insertTextBlock() {
        const p = document.createElement('p');
        p.innerText = 'Tulis paragraf baru di sini...';
        this.insertAtCursor(p);
    }

    insertListBlock() {
        const ol = document.createElement('ol');
        ol.innerHTML = '<li>Langkah pertama</li><li>Langkah kedua</li>';
        this.insertAtCursor(ol);
    }

    insertBulletBlock() {
        const ul = document.createElement('ul');
        ul.innerHTML = '<li>Point informasi</li><li>Point informasi</li>';
        this.insertAtCursor(ul);
    }

    insertSuccessBlock() {
        const div = document.createElement('div');
        div.className = 'callout success';
        div.innerHTML = `
            <div class="callout-title">✅ Selesai</div>
            <p>Jelaskan hasil akhir dari langkah-langkah di atas di sini...</p>
        `;
        this.insertAtCursor(div);
        this.injectAdminTools();
        lucide.createIcons();
    }

    insertCalloutBlock() {
        const div = document.createElement('div');
        div.className = 'callout';
        div.innerHTML = `
            <div class="callout-title">⚠️ Catatan</div>
            <p>Tulis informasi atau catatan di sini...</p>
        `;
        this.insertAtCursor(div);
        this.injectAdminTools();
        lucide.createIcons();
    }

    insertGreetingBlock() {
        const p = document.createElement('p');
        p.style.fontStyle = 'italic';
        p.style.color = 'var(--text-main)';
        p.style.marginTop = '1.5rem';
        p.style.textAlign = 'center';
        p.innerText = 'Selamat mencoba, Sedolor Turbo ST';
        this.insertAtCursor(p);
    }

    insertGreetingBakoelBlock() {
        const p = document.createElement('p');
        p.style.fontStyle = 'italic';
        p.style.color = 'var(--text-main)';
        p.style.marginTop = '1.5rem';
        p.style.textAlign = 'center';
        p.innerText = 'Selamat mencoba, Sedolor Bakoel ST';
        this.insertAtCursor(p);
    }

    insertImagePlaceholder() {
        const div = document.createElement('div');
        div.className = 'img-container';
        div.innerHTML = `
            <div class="img-placeholder">
                <i data-lucide="image" style="width: 32px;"></i>
                <span>Klik untuk upload gambar</span>
            </div>
        `;
        this.insertAtCursor(div);
        this.injectAdminTools();
        lucide.createIcons();
        this.renderTOC();
    }

    renderTOC() {
        this.tocList.innerHTML = '';
        const tocContainer = document.querySelector('.toc-container');
        const headings = this.pageContent.querySelectorAll('h2');
        if (headings.length === 0) {
            if (tocContainer) tocContainer.style.display = 'none';
            return;
        }

        if (tocContainer) tocContainer.style.display = 'block';
        headings.forEach((h, i) => {
            const id = `heading-${i}`;
            h.id = id;
            const li = document.createElement('li');
            li.className = 'toc-item';
            li.innerHTML = `<a href="#${id}" class="toc-link">${h.innerText}</a>`;
            this.tocList.appendChild(li);
        });
    }

    renderPagination() {
        const allPages = this.getAllPages();
        const idx = allPages.findIndex(p => p.id === this.currentPageId);

        if (idx > 0) {
            this.navPrev.style.visibility = 'visible';
            document.getElementById('nav-prev-title').innerText = allPages[idx - 1].title;
        } else {
            this.navPrev.style.visibility = 'hidden';
        }

        if (idx < allPages.length - 1) {
            this.navNext.style.visibility = 'visible';
            document.getElementById('nav-next-title').innerText = allPages[idx + 1].title;
        } else {
            this.navNext.style.visibility = 'hidden';
        }
    }

    getAllPages() {
        let pages = [];
        this.data.apps.forEach(app => {
            pages = [...pages, ...app.pages];
        });
        return pages;
    }

    triggerImageUpload(target) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    this.updateImage(target, base64);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    updateImage(target, base64) {
        const container = target.closest('.img-container');
        container.innerHTML = `<img src="${base64}" alt="Uploaded Image">`;
        this.injectAdminTools();
        lucide.createIcons();
        this.saveData();
    }

    updateLinkModalHashes(currentHash = null) {
        const pageId = this.linkTargetSelect.value;
        const page = this.getAllPages().find(p => p.id === pageId);
        if (page) {
            const temp = document.createElement('div');
            temp.innerHTML = page.content;
            const headings = temp.querySelectorAll('h2');
            if (headings.length > 0) {
                this.linkHashGroup.style.display = 'block';
                this.linkTargetHash.innerHTML = '<option value="">-- Seluruh Halaman --</option>' +
                    Array.from(headings).map((h, i) => `<option value="heading-${i}">${h.innerText}</option>`).join('');
                if (currentHash) this.linkTargetHash.value = currentHash;
            } else {
                this.linkHashGroup.style.display = 'none';
                this.linkTargetHash.innerHTML = '<option value="">-- Tidak ada sub-judul --</option>';
            }
        }
    }

    hideLinkModal() {
        this.modalLink.style.display = 'none';
        this.selectedRange = null;
        this.editingLink = null;
        this.linkHashGroup.style.display = 'none';
    }

    applyInternalLink() {
        const targetId = this.linkTargetSelect.value;
        const targetHash = this.linkTargetHash.value || '';
        if (this.editingLink) {
            this.editingLink.dataset.id = targetId;
            this.editingLink.dataset.hash = targetHash;
            this.hideLinkModal();
        } else if (this.selectedRange && targetId) {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'internal-link';
            link.dataset.id = targetId;
            link.dataset.hash = targetHash;
            link.innerText = this.selectedRange.toString();
            this.selectedRange.deleteContents();
            this.selectedRange.insertNode(link);
            this.hideLinkModal();
            lucide.createIcons();
        }
    }

    removeInternalLink() {
        if (this.editingLink) {
            const text = this.editingLink.innerText;
            this.editingLink.replaceWith(text);
            this.hideLinkModal();
        }
    }

    showModal() {
        this.modalAddPage.style.display = 'flex';
        document.getElementById('new-page-title').focus();
    }

    hideModal() {
        this.modalAddPage.style.display = 'none';
        document.getElementById('new-page-title').value = '';
        document.getElementById('new-page-icon').value = 'file-text';
    }

    search(query) {
        this.navMenu.innerHTML = '';
        const results = [];
        this.data.apps.forEach(app => {
            const matchedPages = app.pages.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.content.toLowerCase().includes(query)
            );
            if (matchedPages.length > 0) {
                results.push({ appName: app.name, pages: matchedPages });
            }
        });

        if (results.length === 0) {
            this.navMenu.innerHTML = '<div class="search-empty">Tidak ada hasil ditemukan.</div>';
            return;
        }

        results.forEach(res => {
            const group = document.createElement('div');
            group.className = 'nav-group';
            group.innerHTML = `
                <div class="nav-group-title">
                    <span>${res.appName}</span>
                </div>
                <ul class="nav-menu">
                    ${res.pages.map(p => `
                        <li class="nav-item">
                            <a href="#" class="nav-link" data-id="${p.id}">${p.title}</a>
                        </li>
                    `).join('')}
                </ul>
            `;
            this.navMenu.appendChild(group);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.id);
            });
        });
    }
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `turbo_st_backup_${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        console.log("Data berhasil diekspor.");
    }

    triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        if (confirm('Apakah Anda yakin ingin menimpa data yang ada dengan file ini?')) {
                            this.data = importedData;
                            await this.saveData();
                            this.renderNav();
                            this.renderPage(this.data.apps[0].pages[0].id);
                            alert('Data berhasil diimpor!');
                        }
                    } catch (err) {
                        alert('Format file tidak valid!');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    takeSnapshot() {
        // Simpan snapshot data saat ini ke dalam history
        const snapshot = JSON.parse(JSON.stringify(this.data));
        if (this.history.length > 0) {
            const lastSnapshot = JSON.stringify(this.history[this.history.length - 1]);
            if (lastSnapshot === JSON.stringify(snapshot)) return; // Jangan simpan jika tidak ada perubahan
        }
        this.history.push(snapshot);
        if (this.history.length > 30) this.history.shift(); // Batasi 30 langkah undo
        this.redoStack = []; // Reset redo stack setiap ada perubahan baru
    }

    undo() {
        if (this.history.length > 0) {
            this.redoStack.push(JSON.parse(JSON.stringify(this.data)));
            this.data = this.history.pop();
            this.renderNav();
            this.renderPage(this.currentPageId);
            console.log("Undo berhasil");
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.history.push(JSON.parse(JSON.stringify(this.data)));
            this.data = this.redoStack.pop();
            this.renderNav();
            this.renderPage(this.currentPageId);
            console.log("Redo berhasil");
        }
    }

    updateCurrentPageData() {
        this.data.apps.forEach(app => {
            const page = app.pages.find(p => p.id === this.currentPageId);
            if (page) {
                // Clone content untuk membersihkan elemen admin sebelum disimpan
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.pageContent.innerHTML;
                tempDiv.querySelectorAll('.btn-delete').forEach(el => el.remove());
                tempDiv.querySelectorAll('.resize-handle').forEach(el => el.remove());

                page.title = this.pageTitle.innerText;
                page.description = this.pageDesc.innerText;
                page.content = tempDiv.innerHTML;
            }
        });
    }

    injectAdminTools() {
        if (!this.isAdminMode) return;

        // Target semua elemen blok utama di dalam konten
        const blocks = this.pageContent.querySelectorAll('h2, p, ul, ol, .img-container, .callout');
        blocks.forEach(block => {
            // Jangan tambahkan jika sudah ada atau jika berada di dalam blok lain (misal P di dalam callout)
            if (block.closest('.img-container, .callout') && block.className !== 'img-container' && block.className !== 'callout') return;

            if (!block.querySelector(':scope > .btn-delete')) {
                const btn = document.createElement('button');
                btn.className = 'btn-delete';
                btn.innerHTML = '<i data-lucide="trash-2" style="width: 14px;"></i>';
                btn.title = 'Hapus Blok';

                // Pastikan block punya position relative untuk menampung button
                if (getComputedStyle(block).position === 'static') {
                    block.style.position = 'relative';
                }

                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm('Hapus bagian ini?')) {
                        this.takeSnapshot();
                        block.remove();
                        this.renderTOC();
                    }
                };
                block.appendChild(btn);
            }

            // Tambahkan fitur resize khusus untuk gambar
            if (block.classList.contains('img-container') && !block.querySelector(':scope > .resize-handle')) {
                const handle = document.createElement('div');
                handle.className = 'resize-handle';
                handle.title = 'Tarik untuk mengubah ukuran';
                handle.addEventListener('mousedown', (e) => this.initResize(e, block));
                block.appendChild(handle);
            }
        });

        // Khusus untuk Judul Utama (H1)
        if (!this.pageTitle.querySelector('.btn-delete')) {
            const btnH1 = document.createElement('button');
            btnH1.className = 'btn-delete';
            btnH1.innerHTML = '<i data-lucide="trash-2" style="width: 14px;"></i>';
            btnH1.title = 'Hapus Judul';
            btnH1.onclick = (e) => {
                e.stopPropagation();
                if (confirm('Hapus judul ini?')) {
                    this.takeSnapshot();
                    this.pageTitle.innerText = '';
                }
            };
            this.pageTitle.style.position = 'relative';
            this.pageTitle.appendChild(btnH1);
        }

        lucide.createIcons();
    }

    async cancelEdit() {
        if (confirm('Batalkan semua perubahan yang belum disimpan?')) {
            console.log("Membatalkan perubahan...");
            this.data = await this.loadData();
            this.history = [];
            this.redoStack = [];
            this.renderNav();
            this.renderPage(this.currentPageId);
            alert('Perubahan dibatalkan. Data telah dikembalikan ke versi terakhir di Cloud.');
        }
    }

    initResize(e, container) {
        e.preventDefault();
        e.stopPropagation();
        this.isResizing = true;
        this.resizeTarget = container;
        this.startX = e.clientX;
        this.startWidth = container.offsetWidth;
        container.classList.add('resizing');
        
        document.body.style.userSelect = 'none';

        this.onMouseMove = (e) => this.handleResize(e);
        this.onMouseUp = (e) => this.stopResize(e);
        
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    handleResize(e) {
        if (!this.isResizing || !this.resizeTarget) return;
        const dx = e.clientX - this.startX;
        const newWidth = this.startWidth + dx;
        
        const parentWidth = this.resizeTarget.parentElement.offsetWidth;
        const finalWidth = Math.max(100, Math.min(newWidth, parentWidth));
        
        const percentage = (finalWidth / parentWidth) * 100;
        this.resizeTarget.style.width = `${percentage}%`;
    }

    stopResize(e) {
        this.isResizing = false;
        if (this.resizeTarget) {
            this.resizeTarget.classList.remove('resizing');
            this.resizeTarget = null;
        }
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        
        this.takeSnapshot();
        this.saveData();
    }
}

new DocApp();
