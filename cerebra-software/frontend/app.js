// ============================================
// URBRAIN - APP.JS
// Updated: Day 10 - Folder Item Counts & Polish
// ============================================

// ============================================
// STATE & DATA STORAGE
// ============================================

let folders = [];
let notes = [];  // NEW - Day 11
let stickyNotes = [];

let currentSearchQuery = ''; // Search state (Day 15)

// Theme state (Day 18)
let currentTheme = 'light'; // 'light' or 'dark'

// Tab system
let tabs = [];
let activeTabId = null;
let tabIdCounter = 1;

// Drag and drop state
let draggedTabId = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('URBRAIN Day 10 - Folder Item Counts & Polish initialized!');
    
    // Load data from localStorage
    loadData();

    // Load settings (NEW - Day 17)
    loadSettings();
    
    // Create initial Home tab
    createTab('home', 'Home', null);
    
    // Initialize UI
    renderTabs();
    renderCurrentView();
    updateCounts();
    
    // Setup event listeners
    setupEventListeners();
});

// ============================================
// DATA MANAGEMENT (LOCALSTORAGE)
// ============================================

/**
 * Load folders and sticky notes from localStorage
 */
function loadData() {
    // Load folders
    const savedFolders = localStorage.getItem('urbrain_folders');
    if (savedFolders) {
        try {
            folders = JSON.parse(savedFolders);
            console.log(`Loaded ${folders.length} folders from localStorage`);
        } catch (e) {
            console.error('Error parsing folders from localStorage:', e);
            folders = [];
        }
    }
    
    // Load sticky notes
    const savedStickies = localStorage.getItem('urbrain_sticky_notes');
    if (savedStickies) {
        try {
            stickyNotes = JSON.parse(savedStickies);
            console.log(`Loaded ${stickyNotes.length} sticky notes from localStorage`);
        } catch (e) {
            console.error('Error parsing sticky notes from localStorage:', e);
            stickyNotes = [];
        }
    }

        // Load notes (NEW - Day 11)
    const savedNotes = localStorage.getItem('urbrain_notes');
    if (savedNotes) {
        try {
            notes = JSON.parse(savedNotes);
            console.log(`Loaded ${notes.length} notes from localStorage`);
        } catch (e) {
            console.error('Error parsing notes from localStorage:', e);
            notes = [];
        }
    }
}

/**
 * Save folders to localStorage
 */
function saveFolders() {
    try {
        localStorage.setItem('urbrain_folders', JSON.stringify(folders));
        console.log('Folders saved to localStorage');
    } catch (e) {
        console.error('Error saving folders to localStorage:', e);
    }
}

/**
 * Save sticky notes to localStorage
 */
function saveStickyNotes() {
    try {
        localStorage.setItem('urbrain_sticky_notes', JSON.stringify(stickyNotes));
        console.log('Sticky notes saved to localStorage');
    } catch (e) {
        console.error('Error saving sticky notes to localStorage:', e);
    }
}

/**
 * Save notes to localStorage (NEW - Day 11)
 */
function saveNotes() {
    try {
        localStorage.setItem('urbrain_notes', JSON.stringify(notes));
        console.log('Notes saved to localStorage');
    } catch (e) {
        console.error('Error saving notes to localStorage:', e);
    }
}

// ============================================
// TAB SYSTEM
// ============================================

/**
 * Create a new tab
 * @param {string} type - Tab type: 'home', 'folder', 'sticky'
 * @param {string} title - Tab title
 * @param {string|null} referenceId - Folder ID or Sticky ID (null for home)
 * @returns {object} The created tab object
 */
function createTab(type, title, referenceId) {
    const tab = {
        id: `tab-${tabIdCounter++}`,
        type: type,
        title: title,
        referenceId: referenceId
    };
    
    tabs.push(tab);
    activeTabId = tab.id;
    
    console.log('Tab created:', tab);
    return tab;
}

/**
 * Switch to a tab by ID
 * @param {string} tabId - The tab ID to switch to
 */
function switchTab(tabId) {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
        console.error('Tab not found:', tabId);
        return;
    }
    
    activeTabId = tabId;
    console.log('Switched to tab:', tab);
    
    renderTabs();
    renderCurrentView();
}

/**
 * Close a tab by ID
 * @param {string} tabId - The tab ID to close
 */
function closeTab(tabId) {
    // Don't allow closing if it's the only tab
    if (tabs.length <= 1) {
        console.log('Cannot close the last tab');
        return;
    }
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) {
        console.error('Tab not found:', tabId);
        return;
    }
    
    const tab = tabs[tabIndex];
    
    // Remove the tab
    tabs.splice(tabIndex, 1);
    
    // If we closed the active tab, switch to the last tab
    if (activeTabId === tabId) {
        if (tabs.length > 0) {
            activeTabId = tabs[tabs.length - 1].id;
        }
    }
    
    console.log('Tab closed:', tab);
    renderTabs();
    renderCurrentView();
}

/**
 * Get the currently active tab
 * @returns {object|null} The active tab object
 */
function getActiveTab() {
    return tabs.find(t => t.id === activeTabId) || null;
}

/**
 * Render all tabs to the tab bar
 */
function renderTabs() {
    const tabsContainer = document.getElementById('tabsContainer');
    if (!tabsContainer) {
        console.error('Tabs container not found');
        return;
    }
    
    tabsContainer.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabElement = createTabElement(tab);
        tabsContainer.appendChild(tabElement);
    });
}

/**
 * Create a tab element
 * @param {object} tab - The tab object
 * @returns {HTMLElement} The tab element
 */
function createTabElement(tab) {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    if (tab.id === activeTabId) {
        tabEl.classList.add('active');
    }
    tabEl.dataset.tabId = tab.id;
    
    // Make tab draggable
    tabEl.draggable = true;
    
    // Tab icon based on type
    let icon = '🏠';
    if (tab.type === 'folder') icon = '📁';
    if (tab.type === 'sticky') icon = '📌';
    
    tabEl.innerHTML = `
        <span class="tab-icon">${icon}</span>
        <span class="tab-title">${escapeHtml(tab.title)}</span>
    `;
    
    // Only add close button if there's more than 1 tab
    if (tabs.length > 1) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Close tab';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent tab switching
            closeTab(tab.id);
        });
        tabEl.appendChild(closeBtn);
    }
    
    // Click to switch tabs
    tabEl.addEventListener('click', () => {
        switchTab(tab.id);
    });
    
    // Drag and drop event handlers
    tabEl.addEventListener('dragstart', handleTabDragStart);
    tabEl.addEventListener('dragover', handleTabDragOver);
    tabEl.addEventListener('drop', handleTabDrop);
    tabEl.addEventListener('dragend', handleTabDragEnd);
    tabEl.addEventListener('dragenter', handleTabDragEnter);
    tabEl.addEventListener('dragleave', handleTabDragLeave);
    
    return tabEl;
}

// ============================================
// TAB DRAG AND DROP HANDLERS
// ============================================

/**
 * Handle drag start
 */
function handleTabDragStart(e) {
    draggedTabId = e.currentTarget.dataset.tabId;
    e.currentTarget.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

/**
 * Handle drag over
 */
function handleTabDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

/**
 * Handle drag enter
 */
function handleTabDragEnter(e) {
    const targetTabId = e.currentTarget.dataset.tabId;
    if (targetTabId !== draggedTabId) {
        e.currentTarget.classList.add('drag-over');
    }
}

/**
 * Handle drag leave
 */
function handleTabDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

/**
 * Handle drop
 */
function handleTabDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    e.currentTarget.classList.remove('drag-over');
    
    const targetTabId = e.currentTarget.dataset.tabId;
    
    if (draggedTabId !== targetTabId) {
        // Find indices
        const draggedIndex = tabs.findIndex(t => t.id === draggedTabId);
        const targetIndex = tabs.findIndex(t => t.id === targetTabId);
        
        // Reorder tabs
        const draggedTab = tabs[draggedIndex];
        tabs.splice(draggedIndex, 1);
        tabs.splice(targetIndex, 0, draggedTab);
        
        // Re-render tabs
        renderTabs();
        
        console.log('Tab reordered');
    }
    
    return false;
}

/**
 * Handle drag end
 */
function handleTabDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    
    // Remove drag-over class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('drag-over');
    });
    
    draggedTabId = null;
}

// ============================================
// VIEW RENDERING
// ============================================

/**
 * Render the current view based on active tab
 */
function renderCurrentView() {
    const activeTab = getActiveTab();
    
    if (!activeTab) {
        console.error('No active tab found');
        return;
    }
    
    console.log('Rendering view for tab:', activeTab);
    
    if (activeTab.type === 'home') {
        renderHomeView();
    } else if (activeTab.type === 'folder') {
        renderFolderView(activeTab.referenceId);
    } else if (activeTab.type === 'note') {
        renderNoteView(activeTab.referenceId);
    } else if (activeTab.type === 'sticky') {
        renderStickyView(activeTab.referenceId);
    }
}

/**
 * Render the home view
 */
function renderHomeView() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <!-- FOLDERS SECTION -->
        <section class="content-section" id="foldersSection">
            <div class="section-header">
                <h2>Folders</h2>
                <p id="folderCount">0 folders</p>
            </div>
            
            <!-- Empty message (shown when no folders) -->
            <div class="empty-message" id="foldersEmptyMessage">
                <div class="empty-icon">📁</div>
                <h3>No folders yet</h3>
                <p>Create your first folder to organize your notes</p>
            </div>
            
            <!-- Grid container (shown when folders exist) -->
            <div class="grid-container" id="foldersGrid" style="display: none;">
                <!-- Folder cards will be added here dynamically -->
            </div>
        </section>
        
        ${currentSearchQuery.trim() !== '' ? `
        <!-- DIVIDER LINE -->
        <hr class="section-divider">
        
        <!-- SEARCH RESULTS - NOTES -->
        <section class="content-section" id="notesSearchSection">
            <div class="section-header">
                <h2>Notes</h2>
                <p id="notesSearchCount">0 notes</p>
            </div>
            
            <div class="empty-message" id="notesSearchEmpty">
                <div class="empty-icon">📝</div>
                <h3>No matching notes</h3>
                <p>No notes found matching your search</p>
            </div>
            
            <div class="grid-container" id="notesSearchGrid" style="display: none;">
                <!-- Note cards will be added here -->
            </div>
        </section>
        ` : ''}
        
        <!-- DIVIDER LINE -->
        <hr class="section-divider">
        
        <!-- STICKY NOTES SECTION -->
        <section class="content-section" id="stickyNotesSection">
            <div class="section-header">
                <h2>Sticky Notes</h2>
                <p id="stickyCount">0 sticky notes</p>
            </div>
            
            <div class="empty-message" id="stickyEmptyMessage">
                <div class="empty-icon">📌</div>
                <h3>No sticky notes yet</h3>
                <p>Create a quick sticky note for reminders</p>
            </div>
            
            <!-- Grid container (for future sticky notes) -->
            <div class="grid-container" id="stickyGrid" style="display: none;">
                <!-- Sticky note cards will be added here dynamically -->
            </div>
        </section>
    `;
    
    // Render folders and sticky notes
    renderFolders();
    renderStickyNotes();
    updateCounts();
    
    // Render search results for notes if searching (Step 2G)
    if (currentSearchQuery.trim() !== '') {
        renderNotesSearchResults();
    }
}

/**
 * Render a folder view
 * @param {string} folderId - The folder ID to render
 */
function renderFolderView(folderId) {
    const folder = getFolderById(folderId);
    if (!folder) {
        console.error('Folder not found:', folderId);
        renderHomeView();
        return;
    }
    
    const contentArea = document.getElementById('contentArea');
    
    // Get subfolders (folders with this folder as parent)
    const subfolders = folders.filter(f => f.parentId === folderId);

    // Get notes in this folder (NEW - Day 11)
    const folderNotes = getNotesInFolder(folderId);
    
    // Build breadcrumb trail
    const breadcrumbTrail = buildBreadcrumbTrail(folderId);
    
    // Generate breadcrumb HTML
    let breadcrumbHTML = '<div class="breadcrumb-container">';
    breadcrumbTrail.forEach((crumb, index) => {
        const isLast = index === breadcrumbTrail.length - 1;
        
        if (isLast) {
            // Current folder - not clickable
            breadcrumbHTML += `<span class="breadcrumb-current">${escapeHtml(crumb.name)}</span>`;
        } else {
            // Parent folders - clickable
            breadcrumbHTML += `<span class="breadcrumb-link" data-folder-id="${crumb.id}">${escapeHtml(crumb.name)}</span>`;
            breadcrumbHTML += `<span class="breadcrumb-separator">></span>`;
        }
    });
    breadcrumbHTML += '</div>';
    
    contentArea.innerHTML = `
        <!-- BREADCRUMB -->
        ${breadcrumbHTML}
        
        <!-- FOLDER VIEW HEADER -->
        <div class="folder-view-header">
            <div class="folder-view-title">
                <h1>📁 ${escapeHtml(folder.name)}</h1>
                <p class="folder-meta">Created ${formatDate(folder.createdAt)}</p>
            </div>
            <div class="folder-view-actions">
                <button class="folder-action-btn" id="addNoteBtn" title="Add Note">
                    <span>📝</span> Add Note
                </button>
                <button class="folder-action-btn" id="addSubfolderBtn" title="Add Subfolder">
                    <span>📁</span> Add Subfolder
                </button>
            </div>
        </div>
        
        <!-- NOTES AREA (Top section, scrollable vertically) -->
        <div class="folder-notes-area">
            <h3>Notes</h3>
            <div class="empty-message" id="folderNotesEmpty" style="${folderNotes.length > 0 ? 'display: none;' : ''}">
                <div class="empty-icon">📝</div>
                <h4>No notes yet</h4>
                <p>Add your first note to this folder</p>
            </div>
            <div class="notes-grid" id="folderNotesGrid" style="${folderNotes.length === 0 ? 'display: none;' : 'display: grid;'}">
                <!-- Note cards will go here -->
            </div>
        </div>
        
        <!-- SUBFOLDERS AREA (Bottom section, horizontal scroll) -->
        <div class="folder-subfolders-area">
            <h3>Subfolders</h3>
            <div class="subfolders-scroll-container" id="subfoldersContainer">
                ${subfolders.length === 0 ? `
                    <div class="empty-message-inline">
                        <span>📁</span> No subfolders yet
                    </div>
                ` : ''}
                <div class="subfolders-horizontal-grid" id="subfoldersGrid">
                    <!-- Subfolder cards will go here -->
                </div>
            </div>
        </div>
    `;
    
    // Render notes if any (NEW - Day 11)
    if (folderNotes.length > 0) {
        const notesGrid = document.getElementById('folderNotesGrid');
        folderNotes.forEach(note => {
            const card = createNoteCard(note);
            notesGrid.appendChild(card);
        });
    }

    // Render subfolders if any
    if (subfolders.length > 0) {
        const subfoldersGrid = document.getElementById('subfoldersGrid');
        subfolders.forEach(subfolder => {
            const card = createFolderCard(subfolder);
            subfoldersGrid.appendChild(card);
        });
    }
    
    // Setup folder view event listeners
    setupFolderViewListeners(folderId);
    
    // Setup breadcrumb click handlers
    setupBreadcrumbListeners();
}

/**
 * Setup event listeners for folder view
 * @param {string} folderId - The current folder ID
 */
function setupFolderViewListeners(folderId) {
    // Add Note button (UPDATED - Day 11)
    const addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            console.log('Add note to folder:', folderId);
            showCreateNoteModal(folderId);
        });
    }
    
    // Add Subfolder button
    const addSubfolderBtn = document.getElementById('addSubfolderBtn');
    if (addSubfolderBtn) {
        addSubfolderBtn.addEventListener('click', () => {
            console.log('Add subfolder to folder:', folderId);
            showCreateSubfolderModal(folderId);
        });
    }
}

/**
 * Setup breadcrumb click listeners
 */
function setupBreadcrumbListeners() {
    const breadcrumbLinks = document.querySelectorAll('.breadcrumb-link');
    breadcrumbLinks.forEach(link => {
        link.addEventListener('click', () => {
            const folderId = link.dataset.folderId;
            console.log('Breadcrumb clicked, navigating to folder:', folderId);
            
            // Open folder in current tab by switching the tab's reference
            const activeTab = getActiveTab();
            if (activeTab) {
                const folder = getFolderById(folderId);
                if (folder) {
                    activeTab.referenceId = folderId;
                    activeTab.title = folder.name;
                    renderTabs();
                    renderCurrentView();
                }
            }
        });
    });
}

/**
 * Render a sticky note view (placeholder)
 * @param {string} stickyId - The sticky note ID
 */
function renderStickyView(stickyId) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="folder-view-header">
            <h1>📌 Sticky Note View</h1>
            <p>Coming in future days!</p>
        </div>
    `;
}

/**
 * Render a note view (NEW - DAY 12)
 * @param {string} noteId - The note ID to render
 */
function renderNoteView(noteId) {
    const note = getNoteById(noteId);
    if (!note) {
        console.error('Note not found:', noteId);
        renderHomeView();
        return;
    }
    
    const contentArea = document.getElementById('contentArea');
    
    // Get the folder this note belongs to
    const folder = getFolderById(note.folderId);
    const folderName = folder ? folder.name : 'Unknown Folder';
    
    // Format dates
    const createdDate = formatDate(note.createdAt);
    const modifiedDate = formatDate(note.modifiedAt);
    
    contentArea.innerHTML = `
        <!-- NOTE VIEW HEADER -->
        <div class="note-view-header">
            <div class="note-view-title">
                <h1>📝 ${escapeHtml(note.title)}</h1>
                <div class="note-view-meta">
                    <span>📁 ${escapeHtml(folderName)}</span>
                    <span>•</span>
                    <span>Created ${createdDate}</span>
                    <span>•</span>
                    <span>Modified ${modifiedDate}</span>
                </div>
            </div>
            <div class="note-view-actions" id="noteViewActions">
                <button class="note-action-btn" id="editNoteBtn" title="Edit Note">
                    <span>✏️</span> Edit
                </button>
                <button class="note-action-btn note-action-btn-danger" id="deleteNoteBtn" title="Delete Note">
                    <span>🗑️</span> Delete
                </button>
            </div>
        </div>
        
        <!-- NOTE CONTENT -->
        <div class="note-view-content" id="noteViewContent">
            ${note.content.trim() === '' 
                ? '<div class="note-empty-content"><p>This note is empty.</p><p class="note-empty-hint">Click Edit to add content!</p></div>'
                : `<div class="note-content-text">${escapeHtml(note.content)}</div>`
            }
        </div>
    `;
    
    // Setup note view event listeners
    setupNoteViewListeners(noteId);
    
    console.log('Note view rendered:', note.title);
}

/**
 * Setup event listeners for note view (NEW - DAY 13)
 * @param {string} noteId - The note ID
 */
function setupNoteViewListeners(noteId) {
    // Edit button
    const editBtn = document.getElementById('editNoteBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            console.log('Edit button clicked for note:', noteId);
            enterEditMode(noteId);
        });
    }
    
    // Delete button
    const deleteBtn = document.getElementById('deleteNoteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            console.log('Delete button clicked for note:', noteId);
            handleDeleteNote(noteId);
        });
    }
}

/**
 * Enter edit mode for a note (NEW - DAY 13)
 * @param {string} noteId - The note ID to edit
 */
function enterEditMode(noteId) {
    const note = getNoteById(noteId);
    if (!note) {
        console.error('Note not found:', noteId);
        return;
    }
    
    console.log('Entering edit mode for:', note.title);
    
    // Replace the action buttons with Save/Cancel
    const actionsDiv = document.getElementById('noteViewActions');
    if (actionsDiv) {
        actionsDiv.innerHTML = `
            <button class="note-action-btn note-action-btn-success" id="saveNoteBtn" title="Save Changes">
                <span>💾</span> Save
            </button>
            <button class="note-action-btn" id="cancelEditBtn" title="Cancel Editing">
                <span>✖️</span> Cancel
            </button>
        `;
    }
    
    // Replace content area with textarea
    const contentDiv = document.getElementById('noteViewContent');
    if (contentDiv) {
        contentDiv.innerHTML = `
            <textarea class="note-edit-textarea" id="noteEditTextarea" placeholder="Write your note content here...">${escapeHtml(note.content)}</textarea>
        `;
        
        // Focus the textarea
        const textarea = document.getElementById('noteEditTextarea');
        if (textarea) {
            textarea.focus();
            // Move cursor to end
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }
    
    // Setup Save button listener
    const saveBtn = document.getElementById('saveNoteBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveNoteChanges(noteId);
        });
    }
    
    // Setup Cancel button listener
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            exitEditMode(noteId);
        });
    }
    
    // Setup keyboard shortcut: Ctrl+S to save
    const textarea = document.getElementById('noteEditTextarea');
    if (textarea) {
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveNoteChanges(noteId);
            }
        });
    }
    
    console.log('Edit mode active');
}

/**
 * Save note changes and exit edit mode (NEW - DAY 13)
 * @param {string} noteId - The note ID to save
 */
function saveNoteChanges(noteId) {
    const note = getNoteById(noteId);
    if (!note) {
        console.error('Note not found:', noteId);
        return;
    }
    
    // Get the new content from textarea
    const textarea = document.getElementById('noteEditTextarea');
    if (!textarea) {
        console.error('Textarea not found');
        return;
    }
    
    const newContent = textarea.value;
    
    // Update the note
    note.content = newContent;
    note.modifiedAt = new Date().toISOString();
    
    // Save to localStorage
    saveNotes();
    
    console.log('✅ Note saved:', note.title);
    
    // Exit edit mode and re-render
    exitEditMode(noteId);
}

/**
 * Exit edit mode without saving (NEW - DAY 13)
 * @param {string} noteId - The note ID
 */
function exitEditMode(noteId) {
    console.log('Exiting edit mode for note:', noteId);
    
    // Re-render the note view (which will show read-only mode)
    renderNoteView(noteId);
}

/**
 * Handle note deletion with confirmation (NEW - DAY 13)
 * @param {string} noteId - The note ID to delete
 */
function handleDeleteNote(noteId) {
    const note = getNoteById(noteId);
    if (!note) {
        console.error('Note not found:', noteId);
        return;
    }
    
    // Confirm deletion (if setting is enabled)
    if (currentSettings.confirmDelete) {
        const confirmMsg = `Delete note "${note.title}"?\n\nThis action cannot be undone!`;
        if (!confirm(confirmMsg)) {
            return;
        }
    }
    
    // Find the note index
    const noteIndex = notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) {
        console.error('Note index not found');
        return;
    }
    
    // Remove the note
    notes.splice(noteIndex, 1);
    
    // Save to localStorage
    saveNotes();
    
    console.log('🗑️ Note deleted:', note.title);
    
    // Close the tab showing this note
    const noteTab = tabs.find(t => t.type === 'note' && t.referenceId === noteId);
    if (noteTab) {
        closeTab(noteTab.id);
    }
    
    // If we're still on a note view (shouldn't happen), go home
    const activeTab = getActiveTab();
    if (activeTab && activeTab.type === 'note') {
        renderHomeView();
    }
}

// ============================================
// FOLDER FUNCTIONS
// ============================================

/**
 * Create a new folder
 * @param {string} name - The folder name
 * @param {string|null} parentId - The parent folder ID (null for root)
 * @returns {object} The created folder object
 */
function createFolder(name, parentId = null) {
    const folder = {
        id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        parentId: parentId,
        createdAt: new Date().toISOString(),
        noteCount: 0
    };
    
    folders.push(folder);
    saveFolders();
    
    console.log('Folder created:', folder);
    return folder;
}

/**
 * Get a folder by ID
 * @param {string} folderId - The folder ID
 * @returns {object|null} The folder object or null if not found
 */
function getFolderById(folderId) {
    return folders.find(f => f.id === folderId) || null;
}

/**
 * Build breadcrumb trail for a folder
 * @param {string} folderId - The folder ID
 * @returns {array} Array of folder objects from root to current
 */
function buildBreadcrumbTrail(folderId) {
    const trail = [];
    let currentFolder = getFolderById(folderId);
    
    // Trace back from current folder to root
    while (currentFolder) {
        trail.unshift(currentFolder); // Add to beginning of array
        
        // Move to parent folder
        if (currentFolder.parentId) {
            currentFolder = getFolderById(currentFolder.parentId);
        } else {
            break; // Reached root folder (no parent)
        }
    }
    
    return trail;
}

/**
 * Get the total count of items in a folder (subfolders + notes)
 * @param {string} folderId - The folder ID
 * @returns {number} Total count of items
 */
function getFolderItemCount(folderId) {
    // Count subfolders (folders that have this folder as parent)
    const subfolderCount = folders.filter(f => f.parentId === folderId).length;
    
    // Count notes in this folder (UPDATED - Day 11)
    const noteCount = notes.filter(n => n.folderId === folderId).length;
    
    // Return total count
    return subfolderCount + noteCount;
}

/**
 * Get all descendant folder IDs (recursive)
 * @param {string} folderId - The parent folder ID
 * @returns {array} Array of all descendant folder IDs
 */
function getAllDescendantFolderIds(folderId) {
    const descendants = [];
    
    // Find direct children
    const children = folders.filter(f => f.parentId === folderId);
    
    // For each child, add it and its descendants
    children.forEach(child => {
        descendants.push(child.id);
        const childDescendants = getAllDescendantFolderIds(child.id);
        descendants.push(...childDescendants);
    });
    
    return descendants;
}

/**
 * Delete a folder and all its contents recursively
 * @param {string} folderId - The folder ID to delete
 */
function deleteFolderRecursive(folderId) {
    // Get all descendant folder IDs
    const descendantIds = getAllDescendantFolderIds(folderId);
    
    // Delete all descendants
    descendantIds.forEach(id => {
        const index = folders.findIndex(f => f.id === id);
        if (index !== -1) {
            folders.splice(index, 1);
        }
    });
    
    // Delete the folder itself
    const index = folders.findIndex(f => f.id === folderId);
    if (index !== -1) {
        folders.splice(index, 1);
    }
    
    // Save changes
    saveFolders();
    
    console.log(`Deleted folder ${folderId} and ${descendantIds.length} descendants`);
}

/**
 * Handle folder deletion with confirmation
 * @param {string} folderId - The folder ID to delete
 */
function handleDeleteFolder(folderId) {
    const folder = getFolderById(folderId);
    if (!folder) {
        console.error('Folder not found:', folderId);
        return;
    }
    
    // Get count of items inside
    const itemCount = getFolderItemCount(folderId);
    const descendantCount = getAllDescendantFolderIds(folderId).length;
    
    // Build confirmation message
    let confirmMessage = `Delete folder "${folder.name}"?`;
    
    if (itemCount > 0) {
        confirmMessage += `\n\nThis folder contains ${itemCount} item${itemCount !== 1 ? 's' : ''}.`;
        if (descendantCount > 0) {
            confirmMessage += ` This will also delete ${descendantCount} subfolder${descendantCount !== 1 ? 's' : ''} inside.`;
        }
        confirmMessage += '\n\nThis action cannot be undone!';
    }
    
    // Show confirmation dialog (if setting is enabled)
    if (currentSettings.confirmDelete) {
        if (!confirm(confirmMessage)) {
            return;
        }
    }

    // Close any tabs showing this folder or its descendants
    const idsToClose = [folderId, ...getAllDescendantFolderIds(folderId)];
    const tabsToClose = tabs.filter(t => t.type === 'folder' && idsToClose.includes(t.referenceId));

    tabsToClose.forEach(tab => {
        closeTab(tab.id);
    });

    // Delete the folder recursively
    deleteFolderRecursive(folderId);

    // Re-render current view
    renderCurrentView();

    console.log('Folder deleted successfully');
}

/**
 * Handle folder rename (inline editing)
 * @param {HTMLElement} titleElement - The title element being edited
 * @param {string} folderId - The folder ID
 */
function handleRenameFolder(titleElement, folderId) {
    const folder = getFolderById(folderId);
    if (!folder) {
        console.error('Folder not found:', folderId);
        return;
    }
    
    // Store original name
    const originalName = folder.name;
    
    // Make element editable
    titleElement.contentEditable = 'true';
    titleElement.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(titleElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Function to save changes
    const saveChanges = () => {
        const newName = titleElement.textContent.trim();
        
        if (newName === '') {
            // Empty name - revert to original
            titleElement.textContent = originalName;
            alert('Folder name cannot be empty');
        } else if (newName !== originalName) {
            // Name changed - update folder
            folder.name = newName;
            saveFolders();
            
            // Update any tabs showing this folder
            tabs.forEach(tab => {
                if (tab.type === 'folder' && tab.referenceId === folderId) {
                    tab.title = newName;
                }
            });
            
            renderTabs();
            console.log('Folder renamed to:', newName);
        }
        
        // Make non-editable
        titleElement.contentEditable = 'false';
        titleElement.blur();
    };
    
    // Function to cancel changes
    const cancelChanges = () => {
        titleElement.textContent = originalName;
        titleElement.contentEditable = 'false';
        titleElement.blur();
    };
    
    // Handle Enter key - save
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveChanges();
            titleElement.removeEventListener('keydown', handleKeyDown);
            titleElement.removeEventListener('blur', handleBlur);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelChanges();
            titleElement.removeEventListener('keydown', handleKeyDown);
            titleElement.removeEventListener('blur', handleBlur);
        }
    };
    
    // Handle blur - save
    const handleBlur = () => {
        saveChanges();
        titleElement.removeEventListener('keydown', handleKeyDown);
        titleElement.removeEventListener('blur', handleBlur);
    };
    
    titleElement.addEventListener('keydown', handleKeyDown);
    titleElement.addEventListener('blur', handleBlur);
}

/**
 * Open a folder in a new tab
 * @param {string} folderId - The folder ID to open
 */
function openFolderInTab(folderId) {
    const folder = getFolderById(folderId);
    if (!folder) {
        console.error('Folder not found:', folderId);
        return;
    }
    
    // Check if folder already has a tab open
    const existingTab = tabs.find(t => t.type === 'folder' && t.referenceId === folderId);
    if (existingTab) {
        // Switch to existing tab
        switchTab(existingTab.id);
    } else {
        // Create new tab
        createTab('folder', folder.name, folderId);
        renderTabs();
        renderCurrentView();
    }
}

// ============================================
// NOTE FUNCTIONS (NEW - DAY 11)
// ============================================

/**
 * Create a new note
 * @param {string} title - The note title
 * @param {string} folderId - The parent folder ID
 * @param {string} content - The note content (default empty)
 * @returns {object|null} The created note object or null if failed
 */
function createNote(title, folderId, content = '') {
    try {
        const now = new Date().toISOString();
        
        // Generate unique ID
        const noteId = 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Create note object
        const newNote = {
            id: noteId,
            title: title,
            content: content,
            folderId: folderId,
            createdAt: now,
            modifiedAt: now
        };
        
        // Add to notes array
        notes.push(newNote);
        
        // Save to localStorage
        saveNotes();
        
        console.log('✅ Note created:', newNote);
        return newNote;
        
    } catch (error) {
        console.error('❌ Error creating note:', error);
        alert('Failed to create note. Please try again.');
        return null;
    }
}

/**
 * Create a note card element (NEW - DAY 11)
 * @param {object} note - The note object
 * @returns {HTMLElement} The note card element
 */
function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'card note-card';
    card.dataset.noteId = note.id;
    
    // Get content preview (first 80 characters)
    const preview = getContentPreview(note.content, 80);
    
    card.innerHTML = `
        <div class="card-icon">📝</div>
        <div class="card-title">${escapeHtml(note.title)}</div>
        <div class="note-preview">${escapeHtml(preview)}</div>
        <div class="card-meta">Created ${formatDate(note.createdAt)}</div>
    `;
    
    // Click to open note (UPDATED - Day 12)
    card.addEventListener('click', () => {
        console.log('Note clicked:', note.title);
        openNoteInTab(note.id);
    });
    
    return card;
}

/**
 * Get content preview (first few words)
 * @param {string} content - The full content
 * @param {number} maxLength - Maximum preview length
 * @returns {string} The preview text
 */
function getContentPreview(content, maxLength = 80) {
    if (!content || content.trim() === '') {
        return 'No content yet...';
    }
    
    const trimmed = content.trim();
    if (trimmed.length <= maxLength) {
        return trimmed;
    }
    
    return trimmed.substring(0, maxLength) + '...';
}

/**
 * Get note by ID
 * @param {string} noteId - The note ID
 * @returns {object|null} The note object or null
 */
function getNoteById(noteId) {
    return notes.find(n => n.id === noteId) || null;
}

/**
 * Get all notes in a folder
 * @param {string} folderId - The folder ID
 * @returns {array} Array of notes in the folder
 */
function getNotesInFolder(folderId) {
    return notes.filter(n => n.folderId === folderId);
}

/**
 * Open a note in a new tab (NEW - DAY 12)
 * @param {string} noteId - The note ID to open
 */
function openNoteInTab(noteId) {
    const note = getNoteById(noteId);
    if (!note) {
        console.error('Note not found:', noteId);
        return;
    }
    
    // Check if note already has a tab open
    const existingTab = tabs.find(t => t.type === 'note' && t.referenceId === noteId);
    if (existingTab) {
        // Switch to existing tab
        switchTab(existingTab.id);
        console.log('Switched to existing note tab:', note.title);
    } else {
        // Create new tab
        createTab('note', note.title, noteId);
        renderTabs();
        renderCurrentView();
        console.log('Opened note in new tab:', note.title);
    }
}

// ============================================
// STICKY NOTE FUNCTIONS (DAY 16)
// ============================================

/**
 * Create a new sticky note
 * @param {string} title - The sticky note title (optional)
 * @param {string} content - The sticky note content
 * @returns {object|null} The created sticky note object or null if failed
 */
function createStickyNote(title, content) {
    try {
        const now = new Date().toISOString();
        
        // Generate unique ID
        const stickyId = 'sticky-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Create sticky note object
        const newSticky = {
            id: stickyId,
            title: title || 'Quick Note',  // Default title if empty
            content: content,
            createdAt: now,
            modifiedAt: now
        };
        
        // Add to stickyNotes array
        stickyNotes.push(newSticky);
        
        // Save to localStorage
        saveStickyNotes();
        
        console.log('✅ Sticky note created:', newSticky);
        return newSticky;
        
    } catch (error) {
        console.error('❌ Error creating sticky note:', error);
        alert('Failed to create sticky note. Please try again.');
        return null;
    }
}

/**
 * Create a sticky note card element
 * @param {object} sticky - The sticky note object
 * @returns {HTMLElement} The sticky card element
 */
function createStickyCard(sticky) {
    const card = document.createElement('div');
    card.className = 'card sticky-card';
    card.dataset.stickyId = sticky.id;
    
    // Get content preview (first 100 characters)
    const preview = sticky.content.trim().substring(0, 100);
    const previewText = preview + (sticky.content.length > 100 ? '...' : '');
    
    card.innerHTML = `
        <div class="card-icon">📌</div>
        <div class="card-title">${escapeHtml(sticky.title)}</div>
        <div class="sticky-content">${escapeHtml(previewText)}</div>
        <div class="card-meta">Created ${formatDate(sticky.createdAt)}</div>
        <button class="card-delete-btn" title="Delete sticky note">🗑️</button>
    `;
    
    // Get delete button
    const deleteBtn = card.querySelector('.card-delete-btn');
    
    // Click to open sticky in modal
    card.addEventListener('click', (e) => {
        // Don't open if clicking delete button
        if (e.target === deleteBtn) {
            return;
        }
        console.log('Sticky clicked:', sticky.title);
        showViewStickyModal(sticky.id);
    });
    
    // Delete button click handler
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't open sticky when clicking delete
        handleDeleteSticky(sticky.id);
    });
    
    return card;
}

/**
 * Get sticky note by ID
 * @param {string} stickyId - The sticky note ID
 * @returns {object|null} The sticky note object or null
 */
function getStickyById(stickyId) {
    return stickyNotes.find(s => s.id === stickyId) || null;
}

/**
 * Handle sticky note deletion with confirmation
 * @param {string} stickyId - The sticky note ID to delete
 */
function handleDeleteSticky(stickyId) {
    const sticky = getStickyById(stickyId);
    if (!sticky) {
        console.error('Sticky note not found:', stickyId);
        return;
    }
    

    // Confirm deletion (if setting is enabled)
    if (currentSettings.confirmDelete) {
        const confirmMsg = `Delete sticky note "${sticky.title}"?\n\nThis action cannot be undone!`;
        if (!confirm(confirmMsg)) {
            return;
        }
    }

    
    // Find the sticky index
    const stickyIndex = stickyNotes.findIndex(s => s.id === stickyId);
    if (stickyIndex === -1) {
        console.error('Sticky note index not found');
        return;
    }
    
    // Remove the sticky note
    stickyNotes.splice(stickyIndex, 1);
    
    // Save to localStorage
    saveStickyNotes();
    
    console.log('🗑️ Sticky note deleted:', sticky.title);
    
    // Re-render current view
    renderCurrentView();
}

// ============================================
// SETTINGS FUNCTIONS (DAY 17)
// ============================================

/**
 * Default settings object
 */
const defaultSettings = {
    appName: 'URBRAIN',
    confirmDelete: true,
    fontSize: 'medium',
    animations: true
};

/**
 * Current settings (loaded from localStorage or defaults)
 */
let currentSettings = { ...defaultSettings };

/**
 * Load settings from localStorage
 */
function loadSettings() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('urbrain_settings');
    
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            currentSettings = { ...currentSettings, ...settings };
            console.log('Settings loaded:', currentSettings);
        } catch (e) {
            console.error('Error parsing settings:', e);
        }
    }
    
    // Load theme preference (NEW - Day 18)
    const savedTheme = localStorage.getItem('urbrain_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        currentTheme = savedTheme;
    }
    
    // Apply settings to UI
    applySettings();
    
    // Apply theme (NEW - Day 18)
    applyTheme();
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem('urbrain_settings', JSON.stringify(currentSettings));
        console.log('Settings saved:', currentSettings);
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

/**
 * Apply settings to the UI
 */
function applySettings() {
    // Apply app name to sidebar
    const sidebarHeader = document.querySelector('.sidebar-header h1');
    if (sidebarHeader) {
        sidebarHeader.textContent = currentSettings.appName;
    }
    
    // Apply font size to body
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${currentSettings.fontSize}`);
    
    // Apply animations setting
    if (!currentSettings.animations) {
        document.body.classList.add('no-animations');
    } else {
        document.body.classList.remove('no-animations');
    }
}

// ============================================
// THEME FUNCTIONS (NEW - DAY 18)
// ============================================

/**
 * Apply the current theme to the document
 */
function applyTheme() {
    const html = document.documentElement;
    
    if (currentTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
    } else {
        html.removeAttribute('data-theme');
    }
    
    // Update the dark mode button icon
    updateThemeButton();
    
    console.log('Theme applied:', currentTheme);
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    // Switch theme
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply the theme
    applyTheme();
    
    // Save to localStorage
    localStorage.setItem('urbrain_theme', currentTheme);
    
    console.log('Theme toggled to:', currentTheme);
}

/**
 * Update the theme button icon
 */
function updateThemeButton() {
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (!darkModeBtn) return;
    
    const icon = darkModeBtn.querySelector('span');
    if (!icon) return;
    
    // Update icon: 🌙 for light mode (click to go dark), ☀️ for dark mode (click to go light)
    if (currentTheme === 'light') {
        icon.textContent = '🌙';
        darkModeBtn.title = 'Switch to Dark Mode';
    } else {
        icon.textContent = '☀️';
        darkModeBtn.title = 'Switch to Light Mode';
    }
}

/**
 * Show the settings modal
 */
function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    // Load current settings into form
    loadSettingsIntoForm();
    
    // Show modal
    modal.style.display = 'flex';
    console.log('Settings modal opened');
}

/**
 * Hide the settings modal
 */
function hideSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Settings modal closed');
    }
}

/**
 * Load current settings into the form inputs
 */
function loadSettingsIntoForm() {
    // App name
    const appNameInput = document.getElementById('appNameSetting');
    if (appNameInput) {
        appNameInput.value = currentSettings.appName;
    }
    
    // Confirm delete
    const confirmDeleteInput = document.getElementById('confirmDeleteSetting');
    if (confirmDeleteInput) {
        confirmDeleteInput.checked = currentSettings.confirmDelete;
    }
    
    // Font size
    const fontSizeInput = document.getElementById('fontSizeSetting');
    if (fontSizeInput) {
        fontSizeInput.value = currentSettings.fontSize;
    }
    
    // Animations
    const animationsInput = document.getElementById('animationsSetting');
    if (animationsInput) {
        animationsInput.checked = currentSettings.animations;
    }
}

/**
 * Save settings from form inputs
 */
function saveSettingsFromForm() {
    // Get values from form
    const appNameInput = document.getElementById('appNameSetting');
    const confirmDeleteInput = document.getElementById('confirmDeleteSetting');
    const fontSizeInput = document.getElementById('fontSizeSetting');
    const animationsInput = document.getElementById('animationsSetting');
    
    // Update settings object
    if (appNameInput) {
        currentSettings.appName = appNameInput.value.trim() || 'URBRAIN';
    }
    if (confirmDeleteInput) {
        currentSettings.confirmDelete = confirmDeleteInput.checked;
    }
    if (fontSizeInput) {
        currentSettings.fontSize = fontSizeInput.value;
    }
    if (animationsInput) {
        currentSettings.animations = animationsInput.checked;
    }
    
    // Save to localStorage
    saveSettings();
    
    // Apply settings immediately
    applySettings();
    
    console.log('Settings saved and applied');
}

/**
 * Switch settings tab
 * @param {string} tabName - The tab to switch to ('general', 'appearance', 'about')
 */
function switchSettingsTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab contents
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to clicked tab
    const clickedTab = document.querySelector(`.settings-tab[data-tab="${tabName}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // Show corresponding content
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    console.log('Switched to settings tab:', tabName);
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
    if (confirm('Reset all settings to defaults?\n\nThis cannot be undone.')) {
        currentSettings = { ...defaultSettings };
        saveSettings();
        applySettings();
        loadSettingsIntoForm();
        console.log('Settings reset to defaults');
    }
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

/**
 * Render all folders to the grid
 */
function renderFolders() {
    const emptyMessage = document.getElementById('foldersEmptyMessage');
    const foldersGrid = document.getElementById('foldersGrid');
    
    if (!emptyMessage || !foldersGrid) {
        console.error('Required elements not found');
        return;
    }
    
    // Clear existing folder cards
    foldersGrid.innerHTML = '';
    
    // Filter folders based on search query
    let rootFolders;
    
    if (currentSearchQuery.trim() !== '') {
        // Search mode - show matching folders (any level)
        const searchResults = performSearch(currentSearchQuery);
        rootFolders = searchResults.folders;
    } else {
        // Normal mode - only show root-level folders
        rootFolders = folders.filter(f => f.parentId === null);
    }
    
    if (rootFolders.length === 0) {
        // Show empty message, hide grid
        emptyMessage.style.display = 'block';
        foldersGrid.style.display = 'none';
    } else {
        // Hide empty message, show grid
        emptyMessage.style.display = 'none';
        foldersGrid.style.display = 'grid';
        
        // Create folder cards
        rootFolders.forEach(folder => {
            const card = createFolderCard(folder);
            foldersGrid.appendChild(card);
        });
    }
}

/**
 * Create a folder card element
 * @param {object} folder - The folder object
 * @returns {HTMLElement} The folder card element
 */
function createFolderCard(folder) {
    const card = document.createElement('div');
    card.className = 'card folder-card';
    card.dataset.folderId = folder.id;
    
    // Get item count
    const itemCount = getFolderItemCount(folder.id);
    const itemText = itemCount === 1 ? 'ITEM' : 'ITEMS';
    
    card.innerHTML = `
        <div class="card-icon">📁</div>
        <div class="card-title">${escapeHtml(folder.name)}</div>
        <div class="card-meta">FOLDER - ${itemCount} ${itemText}</div>
        <button class="card-delete-btn" title="Delete folder">🗑️</button>
    `;
    
    // Get elements
    const titleElement = card.querySelector('.card-title');
    const deleteBtn = card.querySelector('.card-delete-btn');
    
    // Add click event - open folder in new tab
    card.addEventListener('click', (e) => {
        // Don't open if clicking delete button or editing title
        if (e.target === deleteBtn || titleElement.contentEditable === 'true') {
            return;
        }
        console.log('Folder clicked:', folder.name);
        openFolderInTab(folder.id);
    });
    
    // Delete button click handler
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't open folder when clicking delete
        handleDeleteFolder(folder.id);
    });
    
    // Double-click to rename
    titleElement.addEventListener('dblclick', (e) => {
        e.stopPropagation(); // Don't open folder when double-clicking to rename
        handleRenameFolder(titleElement, folder.id);
    });
    
    return card;
}

/**
 * Render sticky notes
 */
function renderStickyNotes() {
    const emptyMessage = document.getElementById('stickyEmptyMessage');
    const stickyGrid = document.getElementById('stickyGrid');
    
    if (!emptyMessage || !stickyGrid) {
        return;
    }
    
    // Clear existing sticky note cards
    stickyGrid.innerHTML = '';
    
    if (stickyNotes.length === 0) {
        emptyMessage.style.display = 'block';
        stickyGrid.style.display = 'none';
    } else {
        emptyMessage.style.display = 'none';
        stickyGrid.style.display = 'grid';
        
        // Create sticky note cards
        stickyNotes.forEach(sticky => {
            const card = createStickyCard(sticky);
            stickyGrid.appendChild(card);
        });
    }
}

/**
 * Update the folder and sticky note counts in the UI
 */
function updateCounts() {
    const folderCount = document.getElementById('folderCount');
    const stickyCount = document.getElementById('stickyCount');
    
    if (folderCount) {
        const count = folders.filter(f => f.parentId === null).length;
        folderCount.textContent = `${count} folder${count !== 1 ? 's' : ''}`;
    }
    
    if (stickyCount) {
        const count = stickyNotes.length;
        stickyCount.textContent = `${count} sticky note${count !== 1 ? 's' : ''}`;
    }
}

/**
 * Render notes search results (DAY 15)
 */
function renderNotesSearchResults() {
    const emptyMessage = document.getElementById('notesSearchEmpty');
    const notesGrid = document.getElementById('notesSearchGrid');
    const notesCount = document.getElementById('notesSearchCount');
    
    if (!emptyMessage || !notesGrid || !notesCount) {
        console.error('Notes search elements not found');
        return;
    }
    
    // Clear existing note cards
    notesGrid.innerHTML = '';
    
    // Get search results
    const searchResults = performSearch(currentSearchQuery);
    const matchingNotes = searchResults.notes;
    
    // Update count
    const count = matchingNotes.length;
    notesCount.textContent = `${count} note${count !== 1 ? 's' : ''}`;
    
    if (matchingNotes.length === 0) {
        // Show empty message, hide grid
        emptyMessage.style.display = 'block';
        notesGrid.style.display = 'none';
    } else {
        // Hide empty message, show grid
        emptyMessage.style.display = 'none';
        notesGrid.style.display = 'grid';
        
        // Create note cards
        matchingNotes.forEach(note => {
            const card = createNoteCard(note);
            notesGrid.appendChild(card);
        });
    }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

/**
 * Show the create folder modal
 */
function showCreateFolderModal() {
    const modal = document.getElementById('createFolderModal');
    const input = document.getElementById('folderNameInput');
    
    if (modal && input) {
        modal.style.display = 'flex';
        modal.dataset.parentId = ''; // Root folder
        input.value = ''; // Clear previous input
        input.focus(); // Focus on input
        console.log('Modal opened for root folder');
    }
}

/**
 * Show modal for creating subfolder
 * @param {string} parentId - The parent folder ID
 */
function showCreateSubfolderModal(parentId) {
    const modal = document.getElementById('createFolderModal');
    const input = document.getElementById('folderNameInput');
    const modalTitle = modal.querySelector('.modal-header h2');
    
    if (modal && input) {
        modal.style.display = 'flex';
        modal.dataset.parentId = parentId;
        input.value = '';
        input.focus();
        
        if (modalTitle) {
            const folder = getFolderById(parentId);
            modalTitle.textContent = `Create Subfolder in "${folder.name}"`;
        }
        
        console.log('Modal opened for subfolder, parent:', parentId);
    }
}

/**
 * Hide the create folder modal
 */
function hideCreateFolderModal() {
    const modal = document.getElementById('createFolderModal');
    const modalTitle = modal.querySelector('.modal-header h2');
    
    if (modal) {
        modal.style.display = 'none';
        modal.dataset.parentId = '';
        
        // Reset title
        if (modalTitle) {
            modalTitle.textContent = 'Create New Folder';
        }
        
        console.log('Modal closed');
    }
}

/**
 * Handle folder creation from modal
 */
function handleCreateFolder() {
    const input = document.getElementById('folderNameInput');
    const modal = document.getElementById('createFolderModal');
    
    if (!input || !modal) {
        console.error('Folder name input or modal not found');
        return;
    }
    
    const folderName = input.value.trim();
    
    if (folderName === '') {
        alert('Please enter a folder name');
        return;
    }
    
    // Get parent ID from modal data attribute
    const parentId = modal.dataset.parentId || null;
    
    // Create the folder
    const newFolder = createFolder(folderName, parentId);
    
    if (newFolder) {
        // Re-render current view
        renderCurrentView();
        
        // Close modal
        hideCreateFolderModal();
        
        console.log('Folder created successfully:', newFolder.name);
    }
}

/**
 * Show the create note modal (NEW - DAY 11)
 * @param {string} folderId - The parent folder ID
 */
function showCreateNoteModal(folderId) {
    const modal = document.getElementById('createNoteModal');
    const input = document.getElementById('noteNameInput');
    
    if (modal && input) {
        modal.style.display = 'flex';
        modal.dataset.folderId = folderId;
        input.value = '';
        input.focus();
        console.log('Create note modal opened for folder:', folderId);
    }
}

/**
 * Hide the create note modal (NEW - DAY 11)
 */
function hideCreateNoteModal() {
    const modal = document.getElementById('createNoteModal');
    
    if (modal) {
        modal.style.display = 'none';
        modal.dataset.folderId = '';
        console.log('Note modal closed');
    }
}

/**
 * Handle note creation from modal (NEW - DAY 11)
 */
function handleCreateNote() {
    const input = document.getElementById('noteNameInput');
    const modal = document.getElementById('createNoteModal');
    
    if (!input || !modal) {
        console.error('Note name input or modal not found');
        return;
    }
    
    const noteTitle = input.value.trim();
    
    if (noteTitle === '') {
        alert('Please enter a note title');
        return;
    }
    
    const folderId = modal.dataset.folderId;
    
    if (!folderId) {
        console.error('No folder ID found in modal');
        return;
    }
    
    // Create the note with empty content
    const newNote = createNote(noteTitle, folderId, '');
    
    if (newNote) {
        renderCurrentView();
        hideCreateNoteModal();
        console.log('Note created successfully:', newNote.title);
    }
}

/**
 * Show the create sticky note modal (NEW - DAY 16)
 */
function showCreateStickyModal() {
    const modal = document.getElementById('createStickyModal');
    const titleInput = document.getElementById('stickyTitleInput');
    const contentInput = document.getElementById('stickyContentInput');
    
    if (modal && titleInput && contentInput) {
        modal.style.display = 'flex';
        titleInput.value = '';
        contentInput.value = '';
        contentInput.focus(); // Focus on content (title is optional)
        console.log('Create sticky modal opened');
    }
}

/**
 * Hide the create sticky note modal (NEW - DAY 16)
 */
function hideCreateStickyModal() {
    const modal = document.getElementById('createStickyModal');
    
    if (modal) {
        modal.style.display = 'none';
        console.log('Sticky modal closed');
    }
}

/**
 * Handle sticky note creation from modal (NEW - DAY 16)
 */
function handleCreateSticky() {
    const titleInput = document.getElementById('stickyTitleInput');
    const contentInput = document.getElementById('stickyContentInput');
    
    if (!titleInput || !contentInput) {
        console.error('Sticky inputs not found');
        return;
    }
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (content === '') {
        alert('Please enter some content for the sticky note');
        return;
    }
    
    // Create the sticky note
    const newSticky = createStickyNote(title, content);
    
    if (newSticky) {
        renderCurrentView();
        hideCreateStickyModal();
        console.log('Sticky note created successfully:', newSticky.title);
    }
}

/**
 * Show modal to view/edit sticky note (NEW - DAY 16)
 * @param {string} stickyId - The sticky note ID to view
 */
function showViewStickyModal(stickyId) {
    // For now, just alert - we'll implement full view/edit in next step
    const sticky = getStickyById(stickyId);
    if (sticky) {
        alert(`Sticky Note: ${sticky.title}\n\n${sticky.content}\n\nFull view/edit modal coming soon!`);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Tab add button (creates new home tab)
    const tabAddBtn = document.getElementById('tabAddBtn');
    if (tabAddBtn) {
        tabAddBtn.addEventListener('click', () => {
            createTab('home', 'Home', null);
            renderTabs();
            renderCurrentView();
        });
    }
    
    // Sidebar folder add button
    const sidebarFolderAddBtn = document.getElementById('sidebarFolderAddBtn');
    if (sidebarFolderAddBtn) {
        sidebarFolderAddBtn.addEventListener('click', showCreateFolderModal);
    }
    
    // Modal close button (X)
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', hideCreateFolderModal);
    }
    
    // Modal cancel button
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', hideCreateFolderModal);
    }
    
    // Modal create button
    const modalCreateBtn = document.getElementById('modalCreateBtn');
    if (modalCreateBtn) {
        modalCreateBtn.addEventListener('click', handleCreateFolder);
    }
    
    // Close modal when clicking outside (on overlay)
    const modal = document.getElementById('createFolderModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            // Only close if clicking directly on the overlay (not the content)
            if (e.target === modal) {
                hideCreateFolderModal();
            }
        });
    }
    
    // Allow Enter key to create folder
    const folderNameInput = document.getElementById('folderNameInput');
    if (folderNameInput) {
        folderNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleCreateFolder();
            }
        });
    }

    // NOTE MODAL LISTENERS (NEW - DAY 11)
    
    // Note modal close button (X)
    const noteModalCloseBtn = document.getElementById('noteModalCloseBtn');
    if (noteModalCloseBtn) {
        noteModalCloseBtn.addEventListener('click', hideCreateNoteModal);
    }
    
    // Note modal cancel button
    const noteModalCancelBtn = document.getElementById('noteModalCancelBtn');
    if (noteModalCancelBtn) {
        noteModalCancelBtn.addEventListener('click', hideCreateNoteModal);
    }
    
    // Note modal create button
    const noteModalCreateBtn = document.getElementById('noteModalCreateBtn');
    if (noteModalCreateBtn) {
        noteModalCreateBtn.addEventListener('click', handleCreateNote);
    }
    
    // Close note modal when clicking outside (on overlay)
    const noteModal = document.getElementById('createNoteModal');
    if (noteModal) {
        noteModal.addEventListener('click', (e) => {
            if (e.target === noteModal) {
                hideCreateNoteModal();
            }
        });
    }
    
    // Allow Enter key to create note
    const noteNameInput = document.getElementById('noteNameInput');
    if (noteNameInput) {
        noteNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleCreateNote();
            }
        });
    }
    
    // STICKY NOTE MODAL LISTENERS (NEW - DAY 16)
        
    // Sidebar sticky add button
    const sidebarStickyAddBtn = document.getElementById('sidebarStickyAddBtn');
    if (sidebarStickyAddBtn) {
        sidebarStickyAddBtn.addEventListener('click', showCreateStickyModal);
    }

    // Sticky modal close button (X)
    const stickyModalCloseBtn = document.getElementById('stickyModalCloseBtn');
    if (stickyModalCloseBtn) {
        stickyModalCloseBtn.addEventListener('click', hideCreateStickyModal);
    }

    // Sticky modal cancel button
    const stickyModalCancelBtn = document.getElementById('stickyModalCancelBtn');
    if (stickyModalCancelBtn) {
        stickyModalCancelBtn.addEventListener('click', hideCreateStickyModal);
    }

    // Sticky modal create button
    const stickyModalCreateBtn = document.getElementById('stickyModalCreateBtn');
    if (stickyModalCreateBtn) {
        stickyModalCreateBtn.addEventListener('click', handleCreateSticky);
    }

    // Close sticky modal when clicking outside (on overlay)
    const stickyModal = document.getElementById('createStickyModal');
    if (stickyModal) {
        stickyModal.addEventListener('click', (e) => {
            if (e.target === stickyModal) {
                hideCreateStickyModal();
            }
        });
    }

    // Allow Enter key in content textarea (Shift+Enter for new line)
    const stickyContentInput = document.getElementById('stickyContentInput');
    if (stickyContentInput) {
        stickyContentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreateSticky();
            }
        });
    }
    
    // Settings button (NEW - Day 17)
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsModal);
    }

    // Settings modal close button (X)
    const settingsModalCloseBtn = document.getElementById('settingsModalCloseBtn');
    if (settingsModalCloseBtn) {
        settingsModalCloseBtn.addEventListener('click', hideSettingsModal);
    }

    // Close settings modal when clicking outside (on overlay)
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                hideSettingsModal();
            }
        });
    }

    // Settings tab switching
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchSettingsTab(tabName);
        });
    });

    // App name input - save on blur and enter
    const appNameInput = document.getElementById('appNameSetting');
    if (appNameInput) {
        appNameInput.addEventListener('blur', saveSettingsFromForm);
        appNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                appNameInput.blur();
            }
        });
    }

    // Auto-save other settings on change
    const confirmDeleteInput = document.getElementById('confirmDeleteSetting');
    if (confirmDeleteInput) {
        confirmDeleteInput.addEventListener('change', saveSettingsFromForm);
    }

    const fontSizeInput = document.getElementById('fontSizeSetting');
    if (fontSizeInput) {
        fontSizeInput.addEventListener('change', saveSettingsFromForm);
    }

    const animationsInput = document.getElementById('animationsSetting');
    if (animationsInput) {
        animationsInput.addEventListener('change', saveSettingsFromForm);
    }

    // Dark mode button (NEW - Day 18)
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            console.log('Dark mode toggle clicked');
            toggleTheme();
        });
    }

    // SEARCH LISTENERS (DAY 15)
    
    // Search input - real-time filtering
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        
        // Keyboard shortcut: Ctrl+F to focus search
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
    
    // Search clear button
    const searchClearBtn = document.getElementById('searchClearBtn');
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', clearSearch);
    }
    
    console.log('Event listeners setup complete');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape HTML to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format a date to a readable string
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

// ============================================
// SEARCH FUNCTIONS (DAY 15)
// ============================================

/**
 * Perform search across folders and notes
 * @param {string} query - The search query
 * @returns {object} Object containing matching folders and notes
 */
function performSearch(query) {
    const lowerQuery = query.toLowerCase().trim();
    
    if (lowerQuery === '') {
        return {
            folders: [],
            notes: [],
            hasResults: false
        };
    }
    
    // Search folders (name only)
    const matchingFolders = folders.filter(folder => {
        return folder.name.toLowerCase().includes(lowerQuery);
    });
    
    // Search notes (title and content)
    const matchingNotes = notes.filter(note => {
        const titleMatch = note.title.toLowerCase().includes(lowerQuery);
        const contentMatch = note.content.toLowerCase().includes(lowerQuery);
        return titleMatch || contentMatch;
    });
    
    console.log(`Search results for "${query}":`, {
        folders: matchingFolders.length,
        notes: matchingNotes.length
    });
    
    return {
        folders: matchingFolders,
        notes: matchingNotes,
        hasResults: matchingFolders.length > 0 || matchingNotes.length > 0
    };
}

/**
 * Handle search input changes
 */
function handleSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    
    if (!searchInput) return;
    
    const query = searchInput.value;
    currentSearchQuery = query;
    
    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
    }
    
    // Only search on home view
    const activeTab = getActiveTab();
    if (activeTab && activeTab.type === 'home') {
        renderHomeView();
    }
}

/**
 * Clear search input
 */
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    
    if (searchInput) {
        searchInput.value = '';
        currentSearchQuery = '';
    }
    
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // Re-render current view
    const activeTab = getActiveTab();
    if (activeTab && activeTab.type === 'home') {
        renderHomeView();
    }
    
    // Refocus search input
    if (searchInput) {
        searchInput.focus();
    }
}
