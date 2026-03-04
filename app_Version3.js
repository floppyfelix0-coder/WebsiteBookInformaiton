// Data Management
class BookManager {
    constructor() {
        this.books = {};
        this.genres = new Set();
        this.loadFromStorage();
    }

    loadFromStorage() {
        const stored = localStorage.getItem('booksData');
        if (stored) {
            try {
                this.books = JSON.parse(stored);
                this.updateGenres();
            } catch (e) {
                console.error('Error loading from storage:', e);
            }
        }
    }

    saveToStorage() {
        localStorage.setItem('booksData', JSON.stringify(this.books));
        this.updateGenres();
    }

    updateGenres() {
        this.genres.clear();
        Object.values(this.books).forEach(book => {
            this.genres.add(book.genre);
        });
    }

    addBook(bookData) {
        const bookId = this.generateId(bookData);
        
        if (this.books[bookId]) {
            return { success: false, message: 'This book already exists!' };
        }

        this.books[bookId] = {
            ...bookData,
            id: bookId,
            publishedDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
        };

        this.saveToStorage();
        return { success: true, message: 'Book published successfully!', bookId };
    }

    updateBook(bookId, bookData) {
        if (!this.books[bookId]) {
            return { success: false, message: 'Book not found!' };
        }

        this.books[bookId] = {
            ...this.books[bookId],
            ...bookData,
            id: bookId,
            updatedDate: new Date().toISOString()
        };

        this.saveToStorage();
        return { success: true, message: 'Book updated successfully!' };
    }

    deleteBook(bookId) {
        if (this.books[bookId]) {
            delete this.books[bookId];
            this.saveToStorage();
            return { success: true, message: 'Book deleted successfully!' };
        }
        return { success: false, message: 'Book not found!' };
    }

    getBook(bookId) {
        return this.books[bookId] || null;
    }

    getAllBooks() {
        return Object.values(this.books);
    }

    getBooksByGenre(genre) {
        return Object.values(this.books).filter(book => book.genre === genre);
    }

    generateId(bookData) {
        const sanitized = `${bookData.genre}-${bookData.title}-${bookData.author}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return sanitized.replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    toJSON() {
        return {
            genreMap: this.buildGenreStructure(),
            allBooks: this.getAllBooks(),
            exportDate: new Date().toISOString()
        };
    }

    buildGenreStructure() {
        const structure = {};
        Object.values(this.books).forEach(book => {
            if (!structure[book.genre]) {
                structure[book.genre] = {
                    books: {}
                };
            }
            structure[book.genre].books[book.id] = {
                title: book.title,
                author: book.author,
                chapters: book.chapters,
                totalPages: book.chapters.reduce((sum, ch) => sum + (ch.pages || 0), 0)
            };
        });
        return structure;
    }
}

// Initialize
const bookManager = new BookManager();
let currentEditingBookId = null;
let currentEditingChapterId = null;

// DOM Elements
const publisherSection = document.getElementById('publisherSection');
const booksViewSection = document.getElementById('booksViewSection');
const writerSection = document.getElementById('writerSection');
const viewToggle = document.getElementById('viewToggle');
const writerToggle = document.getElementById('writerToggle');
const publishBtn = document.getElementById('publishBtn');
const resetBtn = document.getElementById('resetBtn');
const addChapterBtn = document.getElementById('addChapterBtn');
const addGenreBtn = document.getElementById('addGenreBtn');
const syncBtn = document.getElementById('syncBtn');
const statusMessage = document.getElementById('statusMessage');
const editModal = document.getElementById('editModal');
const confirmModal = document.getElementById('confirmModal');

// Form Elements
const genreInput = document.getElementById('genre');
const bookTitleInput = document.getElementById('bookTitle');
const authorInput = document.getElementById('author');
const descriptionInput = document.getElementById('description');
const coverUrlInput = document.getElementById('coverUrl');
const chaptersContainer = document.getElementById('chaptersContainer');
const descriptionCount = document.getElementById('descriptionCount');
const filterGenre = document.getElementById('filterGenre');
const searchBooks = document.getElementById('searchBooks');
const booksContainer = document.getElementById('booksContainer');
const genreList = document.getElementById('genreList');

// Writer Elements
const bookTitleWriter = document.getElementById('bookTitleWriter');
const authorWriter = document.getElementById('authorWriter');
const genreWriter = document.getElementById('genreWriter');
const chaptersListWriter = document.getElementById('chaptersListWriter');
const chapterContentEditor = document.getElementById('chapterContentEditor');
const chapterTitle = document.getElementById('chapterTitle');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const saveChapterBtn = document.getElementById('saveChapterBtn');
const newBookBtn = document.getElementById('newBookBtn');
const publishWriterBtn = document.getElementById('publishWriterBtn');

// Event Listeners
viewToggle.addEventListener('click', () => toggleView('books'));
writerToggle.addEventListener('click', () => toggleView('writer'));
publishBtn.addEventListener('click', publishBook);
resetBtn.addEventListener('click', resetForm);
addChapterBtn.addEventListener('click', addChapter);
addGenreBtn.addEventListener('click', addNewGenre);
syncBtn.addEventListener('click', syncWithGitHub);
descriptionInput.addEventListener('input', updateDescriptionCount);
coverUrlInput.addEventListener('change', updateCoverPreview);
filterGenre.addEventListener('change', renderBooks);
searchBooks.addEventListener('input', renderBooks);
chapterContentEditor.addEventListener('input', updateWordCount);
saveChapterBtn.addEventListener('click', saveChapterContent);
newBookBtn.addEventListener('click', startNewBook);
publishWriterBtn.addEventListener('click', publishFromWriter);

// Initialize UI
updateGenreDatalist();
renderBooks();
resetWriterForm();

// Functions
function toggleView(view) {
    publisherSection.style.display = 'none';
    booksViewSection.style.display = 'none';
    writerSection.style.display = 'none';

    if (view === 'books') {
        booksViewSection.style.display = 'block';
        viewToggle.textContent = '✍️ Write a Book';
    } else if (view === 'writer') {
        writerSection.style.display = 'block';
        writerToggle.textContent = '← Back';
    } else {
        publisherSection.style.display = 'block';
        viewToggle.textContent = '📖 View Books';
    }
}

function startNewBook() {
    toggleView('writer');
    resetWriterForm();
}

function resetWriterForm() {
    bookTitleWriter.value = '';
    authorWriter.value = '';
    genreWriter.value = '';
    chaptersListWriter.innerHTML = '';
    chapterContentEditor.value = '';
    chapterTitle.value = '';
    wordCount.textContent = '0';
    charCount.textContent = '0';
    currentEditingChapterId = null;
    addWriterChapter();
}

function addWriterChapter() {
    const chapterNum = chaptersListWriter.children.length + 1;
    const chapterId = `chapter-${Date.now()}-${Math.random()}`;
    
    const chapterItem = document.createElement('div');
    chapterItem.className = 'writer-chapter-item';
    chapterItem.dataset.chapterId = chapterId;
    chapterItem.innerHTML = `
        <div class="chapter-header">
            <input type="text" class="chapter-name-input" placeholder="Chapter ${chapterNum} Title" value="Chapter ${chapterNum}">
            <button class="btn btn-danger btn-tiny" onclick="removeWriterChapter('${chapterId}')">✕</button>
        </div>
        <div class="chapter-stats">
            <span class="chapter-word-count">0 words</span>
        </div>
    `;
    
    chapterItem.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
            editWriterChapter(chapterId);
        }
    });
    
    chaptersListWriter.appendChild(chapterItem);
}

function editWriterChapter(chapterId) {
    currentEditingChapterId = chapterId;
    const chapterItem = document.querySelector(`[data-chapter-id="${chapterId}"]`);
    const chapterNameInput = chapterItem.querySelector('.chapter-name-input');
    const chapterContent = chapterItem.dataset.content || '';
    
    chapterTitle.value = chapterNameInput.value;
    chapterContentEditor.value = chapterContent;
    updateWordCount();
    
    // Highlight active chapter
    document.querySelectorAll('.writer-chapter-item').forEach(item => {
        item.classList.remove('active');
    });
    chapterItem.classList.add('active');
}

function saveChapterContent() {
    if (!currentEditingChapterId) return;

    const chapterItem = document.querySelector(`[data-chapter-id="${currentEditingChapterId}"]`);
    const chapterNameInput = chapterItem.querySelector('.chapter-name-input');
    const wordCountSpan = chapterItem.querySelector('.chapter-word-count');
    
    chapterNameInput.value = chapterTitle.value || 'Untitled Chapter';
    chapterItem.dataset.content = chapterContentEditor.value;
    
    const words = chapterContentEditor.value.trim().split(/\s+/).filter(w => w).length;
    wordCountSpan.textContent = `${words} words`;
    
    showStatus('✅ Chapter saved!', 'success');
}

function removeWriterChapter(chapterId) {
    const chapterItem = document.querySelector(`[data-chapter-id="${chapterId}"]`);
    if (chaptersListWriter.children.length === 1) {
        showStatus('❌ You must have at least one chapter!', 'error');
        return;
    }
    
    if (currentEditingChapterId === chapterId) {
        currentEditingChapterId = null;
        chapterContentEditor.value = '';
        chapterTitle.value = '';
    }
    
    chapterItem.remove();
    showStatus('📭 Chapter removed', 'info');
}

function updateWordCount() {
    const text = chapterContentEditor.value;
    const words = text.trim().split(/\s+/).filter(w => w).length;
    const chars = text.length;
    wordCount.textContent = words;
    charCount.textContent = chars;
}

function publishFromWriter() {
    if (!bookTitleWriter.value.trim()) {
        showStatus('❌ Please enter a book title!', 'error');
        return;
    }
    if (!authorWriter.value.trim()) {
        showStatus('❌ Please enter an author name!', 'error');
        return;
    }
    if (!genreWriter.value.trim()) {
        showStatus('❌ Please select a genre!', 'error');
        return;
    }
    
    // Save current chapter first
    if (currentEditingChapterId) {
        saveChapterContent();
    }
    
    const chapters = [];
    document.querySelectorAll('.writer-chapter-item').forEach((item, index) => {
        const title = item.querySelector('.chapter-name-input').value;
        const content = item.dataset.content || '';
        const words = content.trim().split(/\s+/).filter(w => w).length;
        const pages = Math.ceil(words / 250);
        
        if (content.trim()) {
            chapters.push({
                number: index + 1,
                title: title || `Chapter ${index + 1}`,
                content: content,
                pages: pages,
                wordCount: words
            });
        }
    });
    
    if (chapters.length === 0) {
        showStatus('❌ Please write content in at least one chapter!', 'error');
        return;
    }

    const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    const bookData = {
        genre: genreWriter.value.trim(),
        title: bookTitleWriter.value.trim(),
        author: authorWriter.value.trim(),
        description: `A book with ${chapters.length} chapters and ${totalWords} words.`,
        coverUrl: '',
        chapters: chapters
    };

    const result = bookManager.addBook(bookData);
    showStatus(result.message + ' 🎉', result.success ? 'success' : 'error');

    if (result.success) {
        updateGenreDatalist();
        renderBooks();
        setTimeout(() => toggleView('books'), 1500);
    }
}

function publishBook() {
    const genre = genreInput.value.trim();
    const title = bookTitleInput.value.trim();
    const author = authorInput.value.trim();
    const description = descriptionInput.value.trim();
    const coverUrl = coverUrlInput.value.trim();
    const chapters = getChaptersData();

    const errors = validateForm(genre, title, author, chapters);
    if (errors.length > 0) {
        showStatus(errors.join('\n'), 'error');
        return;
    }

    const bookData = {
        genre,
        title,
        author,
        description,
        coverUrl,
        chapters
    };

    const result = bookManager.addBook(bookData);
    showStatus(result.message, result.success ? 'success' : 'error');

    if (result.success) {
        resetForm();
    }
}

function validateForm(genre, title, author, chapters) {
    const errors = [];
    if (!genre) errors.push('• Genre is required');
    if (!title) errors.push('• Book title is required');
    if (!author) errors.push('• Author name is required');
    if (chapters.length === 0) errors.push('• Add at least one chapter');
    if (chapters.some(ch => !ch.title)) errors.push('• All chapters must have a title');
    return errors;
}

function getChaptersData() {
    const chapters = [];
    document.querySelectorAll('.chapter-item').forEach((item, index) => {
        const title = item.querySelector('.chapter-title').value.trim();
        const pages = parseInt(item.querySelector('.pages-count').value) || 0;
        if (title || pages > 0) {
            chapters.push({ 
                number: index + 1, 
                title: title || `Chapter ${index + 1}`, 
                pages 
            });
        }
    });
    return chapters;
}

function resetForm() {
    genreInput.value = '';
    bookTitleInput.value = '';
    authorInput.value = '';
    descriptionInput.value = '';
    coverUrlInput.value = '';
    descriptionCount.textContent = '0/1000';
    
    chaptersContainer.innerHTML = '<div class="chapter-item"><input type="text" class="chapter-title" placeholder="Chapter 1 Title"><div class="pages-input"><input type="number" class="pages-count" placeholder="Pages" min="1" max="5000"><span class="pages-label">pages</span></div><button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">✕</button></div>';
    
    document.getElementById('coverPreview').innerHTML = '';
    statusMessage.style.display = 'none';
}

function addChapter() {
    const chapterNum = chaptersContainer.children.length + 1;
    const chapterItem = document.createElement('div');
    chapterItem.className = 'chapter-item';
    chapterItem.innerHTML = `
        <input type="text" class="chapter-title" placeholder="Chapter ${chapterNum} Title">
        <div class="pages-input">
            <input type="number" class="pages-count" placeholder="Pages" min="1" max="5000">
            <span class="pages-label">pages</span>
        </div>
        <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">✕</button>
    `;
    chaptersContainer.appendChild(chapterItem);
}

function addNewGenre() {
    const genre = genreInput.value.trim();
    if (genre && !bookManager.genres.has(genre)) {
        bookManager.genres.add(genre);
        updateGenreDatalist();
        showStatus('✅ Genre added!', 'success');
    } else if (bookManager.genres.has(genre)) {
        showStatus('ℹ️ This genre already exists!', 'info');
    } else {
        showStatus('❌ Please enter a genre name first', 'error');
    }
}

function updateGenreDatalist() {
    genreList.innerHTML = '';
    bookManager.genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        genreList.appendChild(option);
    });
    
    const currentFilter = filterGenre.value;
    filterGenre.innerHTML = '<option value="">All Genres</option>';
    bookManager.genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        filterGenre.appendChild(option);
    });
    filterGenre.value = currentFilter;
}

function updateDescriptionCount() {
    const count = descriptionInput.value.length;
    descriptionCount.textContent = `${count}/1000`;
}

function updateCoverPreview() {
    const url = coverUrlInput.value.trim();
    const preview = document.getElementById('coverPreview');
    
    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.onerror = () => {
            preview.innerHTML = '📖';
        };
        preview.innerHTML = '';
        preview.appendChild(img);
    } else {
        preview.innerHTML = '';
    }
}

function renderBooks() {
    const selectedGenre = filterGenre.value;
    const searchTerm = searchBooks.value.toLowerCase();
    
    let books = selectedGenre ? bookManager.getBooksByGenre(selectedGenre) : bookManager.getAllBooks();
    
    if (searchTerm) {
        books = books.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.genre.toLowerCase().includes(searchTerm)
        );
    }

    booksContainer.innerHTML = '';

    if (books.length === 0) {
        booksContainer.innerHTML = '<div class="empty-state">📭 No books found. Try a different search or genre filter.</div>';
        return;
    }

    books.forEach(book => {
        const bookCard = createBookCard(book);
        booksContainer.appendChild(bookCard);
    });
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const totalPages = book.chapters.reduce((sum, ch) => sum + (ch.pages || 0), 0);
    
    const chaptersHtml = book.chapters.slice(0, 3).map(ch => 
        `<div class="chapter-detail">📖 ${ch.title} (${ch.pages || 0} pages)</div>`
    ).join('');
    
    const hasMore = book.chapters.length > 3 ? `<div class="chapter-detail">... and ${book.chapters.length - 3} more</div>` : '';
    
    const coverHtml = book.coverUrl ? 
        `<img src="${book.coverUrl}" alt="${book.title}">` :
        '📚';

    card.innerHTML = `
        <div class="book-cover">${coverHtml}</div>
        <div class="book-content">
            <div>
                <h3 class="book-title">${escapeHtml(book.title)}</h3>
                <p class="book-author">by ${escapeHtml(book.author)}</p>
                <span class="book-genre">${escapeHtml(book.genre)}</span>
                ${book.description ? `<p class="book-description">${escapeHtml(book.description)}</p>` : ''}
                <div class="book-stats">
                    <div class="stat">📄 ${book.chapters.length} chapters</div>
                    <div class="stat">📖 ${totalPages} pages</div>
                    <div class="stat">📅 ${new Date(book.publishedDate).toLocaleDateString()}</div>
                </div>
                <div class="chapters-list">
                    ${chaptersHtml}
                    ${hasMore}
                </div>
            </div>
            <div class="book-actions">
                <button class="btn btn-secondary" onclick="openEditModal('${book.id}')">✏️ Edit</button>
                <button class="btn btn-danger" onclick="deleteBookConfirm('${book.id}')">🗑️ Delete</button>
            </div>
        </div>
    `;

    return card;
}

function openEditModal(bookId) {
    currentEditingBookId = bookId;
    const book = bookManager.getBook(bookId);
    
    if (!book) return;

    const editFormContainer = document.getElementById('editFormContainer');
    editFormContainer.innerHTML = `
        <div class="form-group">
            <label for="editGenre">Genre</label>
            <input type="text" id="editGenre" value="${escapeHtml(book.genre)}" list="genreList">
        </div>
        <div class="form-group">
            <label for="editTitle">Book Title</label>
            <input type="text" id="editTitle" value="${escapeHtml(book.title)}" maxlength="200">
        </div>
        <div class="form-group">
            <label for="editAuthor">Author</label>
            <input type="text" id="editAuthor" value="${escapeHtml(book.author)}" maxlength="100">
        </div>
        <div class="form-group">
            <label for="editDescription">Description</label>
            <textarea id="editDescription" rows="4" maxlength="1000">${escapeHtml(book.description || '')}</textarea>
        </div>
        <div class="form-group">
            <label for="editCoverUrl">Cover Image URL</label>
            <input type="url" id="editCoverUrl" value="${escapeHtml(book.coverUrl || '')}">
            <div id="editCoverPreview" class="cover-preview">${book.coverUrl ? `<img src="${book.coverUrl}" alt="">` : ''}</div>
        </div>
        <div class="form-group">
            <label>Chapters</label>
            <div id="editChaptersContainer" class="chapters-container">
                ${book.chapters.map((ch, idx) => `
                    <div class="chapter-item">
                        <input type="text" class="chapter-title" value="${escapeHtml(ch.title)}">
                        <div class="pages-input">
                            <input type="number" class="pages-count" value="${ch.pages || 0}" min="1" max="5000">
                            <span class="pages-label">pages</span>
                        </div>
                        <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">✕</button>
                    </div>
                `).join('')}
            </div>
            <button type="button" class="btn btn-secondary" onclick="addEditChapter()">+ Add Chapter</button>
        </div>
        <div class="modal-footer" style="border: none; padding: 1.5rem 0; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveBookEdit()">Save Changes</button>
        </div>
    `;

    document.getElementById('editCoverUrl').addEventListener('change', updateEditCoverPreview);
    editModal.classList.add('active');
}

function closeEditModal() {
    editModal.classList.remove('active');
    currentEditingBookId = null;
}

function addEditChapter() {
    const container = document.getElementById('editChaptersContainer');
    const chapterNum = container.children.length + 1;
    const chapterItem = document.createElement('div');
    chapterItem.className = 'chapter-item';
    chapterItem.innerHTML = `
        <input type="text" class="chapter-title" placeholder="Chapter ${chapterNum} Title">
        <div class="pages-input">
            <input type="number" class="pages-count" placeholder="Pages" min="1" max="5000">
            <span class="pages-label">pages</span>
        </div>
        <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(chapterItem);
}

function updateEditCoverPreview() {
    const url = document.getElementById('editCoverUrl').value.trim();
    const preview = document.getElementById('editCoverPreview');
    
    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.onerror = () => {
            preview.innerHTML = '📖';
        };
        preview.innerHTML = '';
        preview.appendChild(img);
    } else {
        preview.innerHTML = '';
    }
}

function saveBookEdit() {
    if (!currentEditingBookId) return;

    const chapters = [];
    document.querySelectorAll('#editChaptersContainer .chapter-item').forEach((item, index) => {
        const title = item.querySelector('.chapter-title').value.trim();
        const pages = parseInt(item.querySelector('.pages-count').value) || 0;
        if (title || pages > 0) {
            chapters.push({ 
                number: index + 1, 
                title: title || `Chapter ${index + 1}`, 
                pages 
            });
        }
    });

    const updatedData = {
        genre: document.getElementById('editGenre').value.trim(),
        title: document.getElementById('editTitle').value.trim(),
        author: document.getElementById('editAuthor').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        coverUrl: document.getElementById('editCoverUrl').value.trim(),
        chapters
    };

    const result = bookManager.updateBook(currentEditingBookId, updatedData);
    showStatus(result.message, result.success ? 'success' : 'error');

    if (result.success) {
        closeEditModal();
        updateGenreDatalist();
        renderBooks();
    }
}

function deleteBookConfirm(bookId) {
    const book = bookManager.getBook(bookId);
    if (!book) return;

    showConfirmModal(
        'Delete Book?',
        `Are you sure you want to delete "${book.title}" by ${book.author}? This action cannot be undone.`,
        () => {
            const result = bookManager.deleteBook(bookId);
            showStatus(result.message, result.success ? 'success' : 'error');
            if (result.success) {
                updateGenreDatalist();
                renderBooks();
            }
            closeConfirmModal();
        }
    );
}

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmButton').onclick = onConfirm;
    confirmModal.classList.add('active');
}

function closeConfirmModal() {
    confirmModal.classList.remove('active');
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 4000);
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function syncWithGitHub() {
    const jsonData = bookManager.toJSON();
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    console.log('Book data ready for GitHub sync:');
    console.log(jsonString);
    
    navigator.clipboard.writeText(jsonString).then(() => {
        showStatus('📋 Book data copied to clipboard! You can paste this into books.json', 'success');
    }).catch(() => {
        showStatus('Could not copy to clipboard. Check console for data.', 'info');
    });
}

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
    if (e.target === confirmModal) closeConfirmModal();
});