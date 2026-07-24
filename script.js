(function() {
    'use strict';

    // =========================================================================
    // КОНФИГУРАЦИЯ СЕРВЕРНОЙ ФУНКЦИИ (PROXY)
    // =========================================================================
    const PROXY_API_URL = 'https://functions.yandexcloud.net/d4e0ch13vto80l0b9vhr';

    // ---------- Генерация звёздочек ----------
    function createStars() {
        document.querySelectorAll('.star').forEach(el => el.remove());
        const count = Math.floor(Math.random() * 80) + 40;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '✦';
            const size = Math.random() * 18 + 10;
            star.style.fontSize = size + 'px';
            star.style.left = Math.random() * 95 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.opacity = Math.random() * 0.2 + 0.15;
            star.style.animationDuration = (Math.random() * 10 + 6) + 's';
            star.style.animationDelay = (Math.random() * 6) + 's';
            document.body.appendChild(star);
        }
    }

    // ---------- DOM-ссылки ----------
    const menuOverlay = document.getElementById('menuOverlay');
    const mainMenu = document.getElementById('mainMenu');
    const hamburger = document.getElementById('hamburger');
    const menuClose = document.getElementById('menuClose');
    const progressBar = document.getElementById('crossbarProgressBar');

    // ---------- Меню ----------
    function toggleMenu(open) {
        if (mainMenu) mainMenu.classList.toggle('open', open);
        if (menuOverlay) menuOverlay.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }
    if (hamburger) hamburger.addEventListener('click', () => toggleMenu(true));
    if (menuClose) menuClose.addEventListener('click', () => toggleMenu(false));
    if (menuOverlay) menuOverlay.addEventListener('click', () => toggleMenu(false));

    // ---------- Кросс-бар: навигация и прогресс ----------
    let navItems = [];

    function initCrossbarNav() {
        navItems = document.querySelectorAll('#crossbarNav .nav-item');
        navItems.forEach(item => {
            item.removeEventListener('click', handleNavClick);
            item.addEventListener('click', handleNavClick);
        });
    }

    function handleNavClick(e) {
        e.preventDefault();
        const targetId = this.dataset.target;
        const el = document.getElementById(targetId);
        if (el) {
            // Плавный скролл к верхней карточке этого года
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function updateCrossbar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }

        const sections = document.querySelectorAll('.block[id], .event-card[id], .doc-block[id]');
        let activeId = null;
        sections.forEach(sec => {
            const rect = sec.getBoundingClientRect();
            // Порог срабатывания подсветки кросс-бара
            if (rect.top <= 200 && rect.bottom >= 100) {
                activeId = sec.id;
            }
        });
        if (activeId) {
            navItems.forEach(item => {
                item.classList.toggle('active', item.dataset.target === activeId);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        createStars();
        initCrossbarNav();
        updateCrossbar();
    });

    window.addEventListener('scroll', updateCrossbar);
    window.addEventListener('resize', updateCrossbar);

    // ---------- Ленивая загрузка изображений ----------
    function lazyLoadImages() {
        const images = document.querySelectorAll('img.lazy-img, img.lazy-logo');
        images.forEach(img => {
            const src = img.dataset.src;
            if (src && !img.src.includes(src)) {
                const original = new Image();
                original.onload = function() {
                    img.src = src;
                };
                original.src = src;
            }
        });
    }
    document.addEventListener('DOMContentLoaded', lazyLoadImages);
    const observerImages = new MutationObserver(() => lazyLoadImages());
    observerImages.observe(document.body, { childList: true, subtree: true });

    // ---------- Intersection Observer для анимации блоков ----------
    const animateBlocks = document.querySelectorAll('.block[data-animate]');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });
    animateBlocks.forEach(block => io.observe(block));

    // ---------- Копирование email ----------
    document.addEventListener('DOMContentLoaded', function() {
        const emailLink = document.getElementById('copyEmail');
        if (emailLink) {
            emailLink.addEventListener('click', function(e) {
                e.preventDefault();
                const email = 'aero@buran-skb.tech';
                const showSuccess = () => {
                    const originalText = emailLink.textContent;
                    emailLink.textContent = 'Скопировано! ✓';
                    emailLink.style.color = '#4CAF50';
                    setTimeout(() => {
                        emailLink.textContent = originalText;
                        emailLink.style.color = '';
                    }, 2000);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(email).then(showSuccess)
                        .catch(() => fallbackCopy(email, showSuccess));
                } else {
                    fallbackCopy(email, showSuccess);
                }
            });
        }
    });

    function fallbackCopy(text, onSuccess) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.warn('Не удалось скопировать:', err);
        }
        document.body.removeChild(textarea);
    }

    function isLocal() {
        return window.location.protocol === 'file:';
    }

    // ---------- НОВОСТИ (VK через Proxy) ----------
    let loadedVkPosts = [];

    async function loadNews() {
        const newsContainer = document.getElementById('newsContainer') || document.getElementById('newsGrid');
        if (!newsContainer) return;

        if (isLocal()) {
            newsContainer.innerHTML = '<p style="text-align:center; color:#aaa;">Запуск из файла. Для работы новостей запустите веб-сервер.</p>';
            return;
        }

        try {
            const response = await fetch(`${PROXY_API_URL}?action=news`);
            if (!response.ok) throw new Error('Ошибка сети при получении новостей');

            const data = await response.json();
            if (data.error) {
                console.error('Ошибка VK API:', data.error);
                newsContainer.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Ошибка загрузки новостей</p>`;
                return;
            }

            const rawPosts = data.response ? data.response.items : [];
            loadedVkPosts = rawPosts.filter(post => {
                const text = extractPostText(post);
                const media = getPostMedia(post);
                return text.trim().length > 0 || media.url !== '';
            });

            renderNewsSlider(loadedVkPosts, newsContainer);
        } catch (error) {
            console.error('Ошибка загрузки новостей:', error);
            newsContainer.innerHTML = '<p style="color: #ff6b6b; text-align: center;">Не удалось загрузить новости. Попробуйте позже.</p>';
        }
    }

    function extractPostText(post) {
        let text = post.text || '';
        if (!text && post.copy_history && post.copy_history.length > 0) {
            text = post.copy_history[0].text || '';
        }
        return cleanVkText(text);
    }

    function cleanVkText(text) {
        if (!text) return '';
        return text
            .replace(/\[(?:club|id)\d+\|([^\]]+)\]/g, '$1')
            .replace(/\[https?:\/\/[^\|]+\|([^\]]+)\]/g, '$1')
            .trim();
    }

    function getPostMedia(post) {
        let attachments = post.attachments;
        if ((!attachments || !attachments.length) && post.copy_history && post.copy_history.length > 0) {
            attachments = post.copy_history[0].attachments;
        }
        if (!attachments || !attachments.length) {
            return { url: '', fullUrl: '', isVideo: false };
        }
        for (const att of attachments) {
            if (att.type === 'photo' && att.photo && att.photo.sizes) {
                const sizes = att.photo.sizes;
                const preview = sizes.find(s => s.type === 'x') || sizes[sizes.length - 1];
                const full = sizes.find(s => s.type === 'w') || 
                             sizes.find(s => s.type === 'z') || 
                             sizes.find(s => s.type === 'y') || 
                             sizes[sizes.length - 1];
                return { url: preview.url, fullUrl: full.url, isVideo: false };
            }
            if (att.type === 'video' && att.video) {
                const v = att.video;
                let videoImg = '';
                if (v.image && v.image.length) {
                    videoImg = v.image[v.image.length - 1].url;
                } else if (v.first_frame && v.first_frame.length) {
                    videoImg = v.first_frame[v.first_frame.length - 1].url;
                } else {
                    videoImg = v.photo_800 || v.photo_600 || v.photo_320 || '';
                }
                if (videoImg) return { url: videoImg, fullUrl: videoImg, isVideo: true };
            }
            if (att.type === 'doc' && att.doc && att.doc.preview && att.doc.preview.photo) {
                const sizes = att.doc.preview.photo.sizes;
                if (sizes && sizes.length) {
                    const imgUrl = sizes[sizes.length - 1].src || sizes[sizes.length - 1].url;
                    return { url: imgUrl, fullUrl: imgUrl, isVideo: false };
                }
            }
        }
        return { url: '', fullUrl: '', isVideo: false };
    }

    function renderNewsSlider(posts, container) {
        if (!posts || !posts.length) {
            container.innerHTML = '<p style="text-align:center;">Записи не найдены.</p>';
            return;
        }

        const cardsHtml = posts.map((post, index) => {
            const cleanedText = extractPostText(post);
            const truncatedText = cleanedText.length > 120 ? cleanedText.slice(0, 120) + '...' : cleanedText;
            const media = getPostMedia(post);
            return `
                <div class="news-card" onclick="window.openNewsModal(${index})">
                    ${media.url ? `
                        <div class="news-img-wrapper">
                            <img src="${media.url}" alt="Новость" class="news-img" loading="lazy">
                            ${media.isVideo ? '<div class="video-badge">▶ Видео</div>' : ''}
                        </div>
                    ` : ''}
                    <div class="news-content">
                        <p class="news-text">${truncatedText ? truncatedText.replace(/\n/g, '<br>') : 'Смотрите прикреплённые материалы'}</p>
                        <span class="news-link">Подробнее →</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="news-slider-wrapper">
                <button class="news-arrow news-arrow-prev" id="newsPrevBtn" aria-label="Назад">❮</button>
                <div class="news-slider-container">
                    <div class="news-track" id="newsTrack">
                        ${cardsHtml}
                    </div>
                </div>
                <button class="news-arrow news-arrow-next" id="newsNextBtn" aria-label="Вперед">❯</button>
            </div>
        `;

        initSliderLogic();
    }

    window.openNewsModal = function(index) {
        const post = loadedVkPosts[index];
        if (!post) return;

        let overlay = document.getElementById('newsModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'newsModalOverlay';
            overlay.className = 'news-modal-overlay';
            document.body.appendChild(overlay);
        }

        const cleanedText = extractPostText(post);
        const media = getPostMedia(post);
        const postLink = `https://vk.com/wall${post.owner_id}_${post.id}`;

        overlay.innerHTML = `
            <div class="news-modal">
                <button class="news-modal-close" onclick="window.closeNewsModal()" aria-label="Закрыть">&times;</button>
                ${media.fullUrl ? `
                    <div class="news-modal-img-wrapper">
                        <img src="${media.fullUrl}" alt="Новость крупно" class="news-modal-img">
                        ${media.isVideo ? '<div class="video-badge">▶ Видео</div>' : ''}
                    </div>
                ` : ''}
                ${cleanedText ? `<div class="news-modal-text">${cleanedText.replace(/\n/g, '<br>')}</div>` : ''}
                <a href="${postLink}" target="_blank" rel="noopener" class="news-modal-btn">
                    Открыть оригинальный пост в VK →
                </a>
            </div>
        `;

        overlay.onclick = function(e) {
            if (e.target === overlay) window.closeNewsModal();
        };
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeNewsModal = function() {
        const overlay = document.getElementById('newsModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeNewsModal();
            window.closeProjectModal();
            window.closePhotoModal();
            window.closeVideoModal();
        }
    });

    function initSliderLogic() {
        const track = document.getElementById('newsTrack');
        const prevBtn = document.getElementById('newsPrevBtn');
        const nextBtn = document.getElementById('newsNextBtn');
        const container = track ? track.parentElement : null;
        if (!track || !prevBtn || !nextBtn || !container) return;

        let currentIndex = 0;

        function updateSlider() {
            const card = track.querySelector('.news-card');
            if (!card) return;
            const gap = 20;
            const cardWidth = card.offsetWidth + gap;
            const containerWidth = container.offsetWidth;
            const visibleCards = Math.max(1, Math.floor((containerWidth + gap) / cardWidth));
            const totalCards = track.children.length;
            const maxIndex = Math.max(0, totalCards - visibleCards);
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex > maxIndex) currentIndex = maxIndex;
            track.style.transform = `translate3d(-${currentIndex * cardWidth}px,0,0)`;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex;
        }

        prevBtn.onclick = () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        };
        nextBtn.onclick = () => {
            currentIndex++;
            updateSlider();
        };
        window.addEventListener('resize', updateSlider);
        updateSlider();
    }

    // ---------- ПАРТНЁРЫ ----------
    async function loadPartners() {
        const track = document.getElementById('partnersTrack');
        if (!track) return;

        function startRandomSpawner(partnerList) {
            if (!partnerList || !partnerList.length) {
                track.innerHTML = '<p style="color: #ffccaa;">Нет данных о партнёрах.</p>';
                return;
            }
            const maxLogoHeight = partnerList.reduce((max, p) => Math.max(max, p.size), 80);
            const containerHeight = maxLogoHeight + 120;
            const wrapper = track.closest('.partners-wrapper') || track;
            wrapper.style.height = `${containerHeight}px`;
            track.innerHTML = '';
            const activeCounts = {};

            function spawnPartner() {
                const availablePartners = partnerList.filter(p => (activeCounts[p.id] || 0) < 1);
                if (availablePartners.length === 0) {
                    setTimeout(spawnPartner, 500);
                    return;
                }
                const partner = availablePartners[Math.floor(Math.random() * availablePartners.length)];
                activeCounts[partner.id] = (activeCounts[partner.id] || 0) + 1;
                const el = document.createElement('div');
                el.className = 'partner-item active';
                el.innerHTML = `
                    <a href="${partner.link}" target="_blank" rel="noopener">
                        <img src="logo/${partner.imgSrc}" style="height: ${partner.size}px;" alt="Партнёр">
                    </a>
                `;
                const minTop = 10;
                const maxTop = Math.max(minTop, containerHeight - partner.size - 10);
                const randomTop = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
                el.style.top = `${randomTop}px`;
                const randomDuration = (Math.random() * 5 + 7).toFixed(1);
                el.style.animationDuration = `${randomDuration}s`;
                el.addEventListener('animationend', () => {
                    activeCounts[partner.id] = Math.max(0, (activeCounts[partner.id] || 1) - 1);
                    el.remove();
                });
                track.appendChild(el);
                const minDelay = Math.max(600, 2200 - partnerList.length * 150);
                const nextSpawnDelay = Math.random() * 800 + minDelay;
                setTimeout(spawnPartner, nextSpawnDelay);
            }

            spawnPartner();
            setTimeout(spawnPartner, 1000);
        }

        function parsePartnerLines(lines) {
            const list = [];
            lines.forEach((line, index) => {
                const parts = line.split(',').map(s => s.trim());
                if (parts.length >= 4) {
                    const [orig, comp, size, link] = parts;
                    const sizePx = parseInt(size, 10) || 80;
                    list.push({
                        id: index,
                        imgSrc: comp || orig,
                        size: sizePx,
                        link: link
                    });
                }
            });
            return list;
        }

        try {
            const resp = await fetch('sponsor.txt');
            if (!resp.ok) throw new Error('sponsor.txt не найден');
            const text = await resp.text();
            const lines = text.split('\n').filter(line => line.trim());
            const partnerList = parsePartnerLines(lines);
            if (partnerList.length) {
                startRandomSpawner(partnerList);
            } else {
                track.innerHTML = '<p style="color: #ffccaa;">Файл sponsor.txt пуст.</p>';
            }
        } catch (e) {
            console.warn('Ошибка считывания sponsor.txt, сработал фоллбэк:', e);
            const fallbackLines = [
                'skbbyranlogo.svg, skbbyranlogocomp.png, 80, https://vk.com/skbburan',
                'vlsulogo.svg, vlsulogocomp.png, 100, https://www.vlsu.ru/'
            ];
            startRandomSpawner(parsePartnerLines(fallbackLines));
        }
    }

    // ---------- ПРОЕКТЫ С СОРТИРОВКОЙ ПО ДАТЕ ----------
    function sortProjectsByDate(projects) {
        return projects.sort((a, b) => {
            const dateA = a['Дата начала'] ? new Date(a['Дата начала']) : new Date(0);
            const dateB = b['Дата начала'] ? new Date(b['Дата начала']) : new Date(0);
            return dateB - dateA; // Свежие проекты первыми
        });
    }

    async function loadProjects() {
        const hotContainer = document.getElementById('projectsHot');
        const gridContainer = document.getElementById('projectsGrid');
        if (!hotContainer && !gridContainer) return;

        if (isLocal()) {
            let demoProjects = [
                { Название: 'Робот-манипулятор', Описание: 'Разработка промышленного робота', 'Полное описание': 'Подробное описание проекта...', Пометки: 'Открытый, Грантовый', Ссылки: 'https://github.com', Фото: 'project_robot.jpg', Сжатое: 'project_robot_comp.jpg', 'Дата начала': '2026-01-01', 'Дата закрытия': '2026-06-01' },
                { Название: 'Спутник-кубсат', Описание: 'Создание малого космического аппарата', 'Полное описание': 'Проект по разработке спутника формата 3U.', Пометки: 'Открытая разработка', Ссылки: 'https://space.ru', Фото: 'sat.jpg', Сжатое: 'sat_comp.jpg', 'Дата начала': '2025-09-01' }
            ];
            
            demoProjects = sortProjectsByDate(demoProjects);
            const openProjects = demoProjects.filter(p => p.Пометки && p.Пометки.includes('Открытый'));

            function renderDemoCard(p, isHot = false) {
                const tags = (p.Пометки || '').split(',').map(s => s.trim()).filter(Boolean);
                const tagMapping = {
                    'Открытый': 'tag-open',
                    'Завершенный': 'tag-closed',
                    'Грантовый': 'tag-grant',
                    'Открытая разработка': 'tag-dev',
                    'Коллаборация': 'tag-joint',
                    'Спонсируется': 'tag-support'
                };
                const tagHtml = tags
                    .filter(t => tagMapping[t])
                    .map(t => `<span class="tag ${tagMapping[t]}">${t}</span>`)
                    .join('');
                const fullDesc = p['Полное описание'] || p.Описание || '';
                const shortDesc = p.Описание ? p.Описание.slice(0, 100)+(p.Описание.length>100?'...':'') : '';
                return `
                    <div class="project-card" data-full='${encodeURIComponent(JSON.stringify(p))}'>
                        <div class="project-body">
                            <h3>${p.Название || 'Проект'}</h3>
                            <p class="project-desc">${isHot ? fullDesc : shortDesc}</p>
                            <div class="project-tags">${tagHtml}</div>
                        </div>
                    </div>
                `;
            }

            if (hotContainer) hotContainer.innerHTML = openProjects.map(p => renderDemoCard(p, true)).join('');
            if (gridContainer) gridContainer.innerHTML = demoProjects.map(p => renderDemoCard(p, false)).join('');

            document.querySelectorAll('.project-card').forEach(card => {
                card.addEventListener('click', function() {
                    const data = JSON.parse(decodeURIComponent(this.dataset.full));
                    openProjectModal(data);
                });
            });
            return;
        }

        try {
            const resp = await fetch('project.txt');
            if (!resp.ok) throw new Error('project.txt not found');
            const text = await resp.text();
            const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
            let projects = blocks.map(block => {
                const lines = block.split('\n');
                const obj = {};
                lines.forEach(line => {
                    const sep = line.indexOf(':');
                    if (sep > 0) {
                        const key = line.slice(0, sep).trim();
                        const val = line.slice(sep+1).trim();
                        obj[key] = val;
                    }
                });
                return obj;
            });

            // Сортировка проектов по дате начала (свежие сверху)
            projects = sortProjectsByDate(projects);

            const openProjects = projects.filter(p => p.Пометки && p.Пометки.includes('Открытый'));
            const allProjects = projects;

            function renderProjectCard(p, isHot = false) {
                const tags = (p.Пометки || '').split(',').map(s => s.trim()).filter(Boolean);
                const tagMapping = {
                    'Открытый': 'tag-open',
                    'Завершенный': 'tag-closed',
                    'Грантовый': 'tag-grant',
                    'Открытая разработка': 'tag-dev',
                    'Коллаборация': 'tag-joint',
                    'Спонсируется': 'tag-support'
                };
                const tagHtml = tags
                    .filter(t => tagMapping[t])
                    .map(t => `<span class="tag ${tagMapping[t]}">${t}</span>`)
                    .join('');
                const imgSrc = p.Сжатое ? `img/${p.Сжатое}` : '';
                const imgOrig = p.Фото ? `img/${p.Фото}` : '';
                const fullDesc = p['Полное описание'] || p.Описание || '';
                const shortDesc = p.Описание ? p.Описание.slice(0, 100) + (p.Описание.length > 100 ? '...' : '') : '';
                return `
                    <div class="project-card" data-full='${encodeURIComponent(JSON.stringify(p))}'>
                        ${imgSrc ? `<img src="${imgSrc}" data-src="${imgOrig}" class="lazy-img" alt="${p.Название || ''}" loading="lazy">` : ''}
                        <div class="project-body">
                            <h3>${p.Название || 'Проект'}</h3>
                            <p class="project-desc">${isHot ? fullDesc : shortDesc}</p>
                            <div class="project-tags">${tagHtml}</div>
                        </div>
                    </div>
                `;
            }

            if (hotContainer) {
                hotContainer.innerHTML = openProjects.length ? openProjects.map(p => renderProjectCard(p, true)).join('') : '<p>Нет открытых проектов.</p>';
            }
            if (gridContainer) {
                gridContainer.innerHTML = allProjects.length ? allProjects.map(p => renderProjectCard(p, false)).join('') : '<p>Проекты отсутствуют.</p>';
            }

            document.querySelectorAll('.project-card').forEach(card => {
                card.addEventListener('click', function() {
                    const data = JSON.parse(decodeURIComponent(this.dataset.full));
                    openProjectModal(data);
                });
            });
            lazyLoadImages();
        } catch (e) {
            console.warn('Ошибка загрузки проектов:', e);
            if (hotContainer) hotContainer.innerHTML = '<p>Не удалось загрузить проекты.</p>';
            if (gridContainer) gridContainer.innerHTML = '<p>Не удалось загрузить проекты.</p>';
        }
    }

    function openProjectModal(data) {
        let overlay = document.getElementById('projectModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'projectModalOverlay';
            overlay.className = 'news-modal-overlay';
            document.body.appendChild(overlay);
        }
        const tags = (data.Пометки || '').split(',').map(s => s.trim()).filter(Boolean);
        const tagMapping = {
            'Открытый': 'tag-open',
            'Завершенный': 'tag-closed',
            'Грантовый': 'tag-grant',
            'Открытая разработка': 'tag-dev',
            'Коллаборация': 'tag-joint',
            'Спонсируется': 'tag-support'
        };
        const tagHtml = tags
            .filter(t => tagMapping[t])
            .map(t => `<span class="tag ${tagMapping[t]}">${t}</span>`)
            .join('');
        const imgSrc = data.Фото ? `img/${data.Фото}` : '';
        const imgComp = data.Сжатое ? `img/${data.Сжатое}` : '';
        overlay.innerHTML = `
            <div class="news-modal">
                <button class="news-modal-close" onclick="window.closeProjectModal()" aria-label="Закрыть">&times;</button>
                ${imgSrc ? `<div class="news-modal-img-wrapper"><img src="${imgComp}" data-src="${imgSrc}" class="lazy-img" alt="${data.Название}" loading="lazy"></div>` : ''}
                <h2>${data.Название || 'Проект'}</h2>
                <div class="project-tags" style="margin: 12px 0;">${tagHtml}</div>
                <div class="news-modal-text">${data['Полное описание'] || data.Описание || ''}</div>
                ${data['Дата начала'] ? `<p><strong>Начало:</strong> ${data['Дата начала']}</p>` : ''}
                ${data['Дата закрытия'] ? `<p><strong>Закрытие:</strong> ${data['Дата закрытия']}</p>` : ''}
                ${data.Ссылки ? `<p><strong>Ссылки:</strong> ${data.Ссылки.split(',').map(s => `<a href="${s.trim()}" target="_blank">${s.trim()}</a>`).join(' ')}</p>` : ''}
            </div>
        `;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        overlay.onclick = function(e) {
            if (e.target === overlay) window.closeProjectModal();
        };
    }

    window.closeProjectModal = function() {
        const overlay = document.getElementById('projectModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // ---------- ГАЛЕРЕЯ / СОБЫТИЯ С ЧЁТКИМ ПЕРЕМЕЩЕНИЕМ ПО ГОДАМ ----------
    async function loadGallery() {
        const container = document.getElementById('galleryEvents');
        if (!container) return;

        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Загрузка альбомов...</div>';

        if (isLocal()) {
            container.innerHTML = `
                <div class="event-card" id="year-2026" style="scroll-margin-top: 100px;">
                    <div class="event-card-header">
                        <h3>Демо-событие (локальный запуск)</h3>
                        <span class="event-card-date">2026-07-23</span>
                    </div>
                    <div class="event-card-description open">Локальный режим просмотра.</div>
                </div>`;
            return;
        }

        function getEmbedUrl(url) {
            let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (match) return { embed: `https://www.youtube.com/embed/${match[1]}`, platform: 'youtube' };

            match = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9_-]+)/);
            if (match) return { embed: `https://rutube.ru/embed/${match[1]}/`, platform: 'rutube' };

            match = url.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+)_(\d+)/);
            if (match) return { embed: `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2`, platform: 'vk', owner: match[1], id: match[2] };

            match = url.match(/(?:dzen\.ru|zen\.yandex\.ru)\/(?:video\/watch|watch)\/([a-zA-Z0-9_-]+)/);
            if (match) return { embed: `https://dzen.ru/embed/video/${match[1]}`, platform: 'dzen' };

            return null;
        }

        try {
            let events = [];
            const resp = await fetch('event.txt');
            if (resp.ok) {
                const text = await resp.text();
                if (text.trim()) {
                    const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
                    blocks.forEach(block => {
                        const lines = block.split('\n');
                        const obj = {};
                        lines.forEach(line => {
                            const sep = line.indexOf(':');
                            if (sep > 0) {
                                obj[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
                            }
                        });
                        if (obj.Разрешено !== 'false') {
                            events.push({
                                id: obj.Альбом || 'wall',
                                Название: obj.Название || 'Событие',
                                Дата: obj.Дата || '2026-01-01',
                                Описание: obj.Описание || '',
                                Альбом: obj.Альбом || '',
                                Фото: obj.Фото || ''
                            });
                        }
                    });
                }
            }

            // Сортировка событий по дате (от новых к старым)
            events.sort((a, b) => new Date(b.Дата) - new Date(a.Дата));

            if (events.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#888; padding:30px;">В файле event.txt не указано ни одного события.</p>';
                return;
            }

            container.innerHTML = '';

            // Получаем список унікальных лет по порядку
            const yearsSet = new Set();
            events.forEach(ev => {
                const year = ev.Дата.split('-')[0];
                if (year) yearsSet.add(year);
            });

            // Генерация кнопок кросс-бара по годам
            const crossbarNav = document.getElementById('crossbarNav');
            if (crossbarNav && yearsSet.size > 0) {
                crossbarNav.innerHTML = Array.from(yearsSet).map(year => 
                    `<span class="nav-item" data-target="year-${year}">${year}</span>`
                ).join('');
                initCrossbarNav();
            }

            const yearAnchorsAdded = new Set();

            for (const ev of events) {
                const albumId = ev.Альбом;
                const title = ev.Название;
                const date = ev.Дата;
                const description = ev.Описание;
                const year = date.split('-')[0];

                const card = document.createElement('div');
                card.className = 'event-card';
                card.dataset.date = date;
                card.style.scrollMarginTop = '100px'; // Отступ при прокрутке, чтобы карточка не пряталась под шапку

                // Привязываем ID года к самой первой (верхней) карточке этого года
                if (year && !yearAnchorsAdded.has(year)) {
                    card.id = `year-${year}`;
                    yearAnchorsAdded.add(year);
                }

                const header = document.createElement('div');
                header.className = 'event-card-header';
                header.innerHTML = `<h3>${title}</h3><span class="event-card-date">${date}</span>`;
                card.appendChild(header);

                const descBlock = document.createElement('div');
                descBlock.className = 'event-card-description';
                descBlock.textContent = description;
                card.appendChild(descBlock);

                card.addEventListener('click', function(e) {
                    if (e.target.closest('.photo-item') || e.target.closest('.video-item')) return;
                    descBlock.classList.toggle('open');
                });
                container.appendChild(card);

                const grid = document.createElement('div');
                grid.className = 'event-photos';
                let photos = [];
                let customItems = [];

                if (ev.Фото) {
                    const urls = ev.Фото.split(',').map(s => s.trim());
                    for (const url of urls) {
                        const videoData = getEmbedUrl(url);
                        if (videoData) {
                            customItems.push({
                                type: 'video',
                                embed: videoData.embed,
                                platform: videoData.platform,
                                url: url
                            });
                        } else {
                            customItems.push({ type: 'image', url: url });
                        }
                    }
                }

                if (albumId && albumId !== 'none' && albumId !== 'wall') {
                    try {
                        const pResp = await fetch(`${PROXY_API_URL}?action=photos&album_id=${albumId}`);
                        const pData = await pResp.json();
                        if (pData.response && pData.response.items) {
                            photos = pData.response.items;
                        }
                    } catch (err) {
                        console.warn(`Не удалось загрузить фото альбома ${albumId}`, err);
                    }
                }

                if (photos.length === 0 && customItems.length === 0) {
                    const emptyMsg = document.createElement('div');
                    emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; color: #888; padding: 15px; font-size: 16px;';
                    emptyMsg.textContent = 'В этом альбоме пока нет доступных материалов.';
                    grid.appendChild(emptyMsg);
                }

                photos.forEach(photo => {
                    const sizes = photo.sizes || [];
                    const best = sizes.reduce((a, b) => (a.width > b.width ? a : b), sizes[0]);
                    if (!best) return;
                    const item = document.createElement('div');
                    item.className = 'photo-item';
                    const img = document.createElement('img');
                    img.src = best.url;
                    img.alt = title;
                    img.loading = 'lazy';
                    item.appendChild(img);

                    const btn = document.createElement('button');
                    btn.className = 'download-btn';
                    btn.textContent = '⬇ Скачать';
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        window.downloadPhoto(best.url);
                    });
                    item.appendChild(btn);
                    item.addEventListener('click', () => window.openPhotoModal(best.url));
                    grid.appendChild(item);
                });

                for (const item of customItems) {
                    if (item.type === 'image') {
                        const div = document.createElement('div');
                        div.className = 'photo-item';
                        const img = document.createElement('img');
                        img.src = item.url;
                        img.alt = 'Фото';
                        img.loading = 'lazy';
                        div.appendChild(img);

                        const btn = document.createElement('button');
                        btn.className = 'download-btn';
                        btn.textContent = '⬇ Скачать';
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            window.downloadPhoto(item.url);
                        });
                        div.appendChild(btn);
                        div.addEventListener('click', () => window.openPhotoModal(item.url));
                        grid.appendChild(div);
                    } else if (item.type === 'video') {
                        const div = document.createElement('div');
                        div.className = 'video-item';

                        const icon = document.createElement('span');
                        icon.className = 'play-icon';
                        icon.textContent = '▶';
                        div.appendChild(icon);

                        const badge = document.createElement('div');
                        badge.className = 'video-badge';
                        badge.textContent = '🎬 Видео';
                        div.appendChild(badge);

                        div.addEventListener('click', function(e) {
                            e.stopPropagation();
                            window.openVideoModal(item.embed);
                        });
                        grid.appendChild(div);
                    }
                }

                container.appendChild(grid);
            }

            const searchInput = document.getElementById('gallerySearch');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const val = this.value.toLowerCase().trim();
                    document.querySelectorAll('.event-card').forEach((card, idx) => {
                        const text = card.textContent.toLowerCase();
                        const isMatch = text.includes(val);
                        card.style.display = isMatch ? '' : 'none';
                        const correspondingGrid = container.querySelectorAll('.event-photos')[idx];
                        if (correspondingGrid) {
                            correspondingGrid.style.display = isMatch ? '' : 'none';
                        }
                    });
                });
            }

            updateCrossbar();

        } catch (error) {
            console.error('Ошибка загрузки галереи:', error);
            container.innerHTML = '<p style="text-align:center; color:#ff6b6b; padding:20px;">Не удалось загрузить галерею.</p>';
        }
    }

    // ---------- МОДАЛЬНЫЕ ОКНА ДЛЯ ФОТО И ВИДЕО ----------
    window.openPhotoModal = function(url) {
        let overlay = document.getElementById('photoModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'photoModalOverlay';
            overlay.className = 'photo-modal-overlay';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
            <div class="photo-modal">
                <button class="news-modal-close" onclick="window.closePhotoModal()">&times;</button>
                <img src="${url}" alt="Фото">
                <button class="download-btn" onclick="window.downloadPhoto('${url}')">⬇ Скачать</button>
            </div>
        `;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        overlay.onclick = function(e) {
            if (e.target === overlay) window.closePhotoModal();
        };
    };

    window.closePhotoModal = function() {
        const overlay = document.getElementById('photoModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    window.openVideoModal = function(embedUrl) {
        let overlay = document.getElementById('videoModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'videoModalOverlay';
            overlay.className = 'photo-modal-overlay';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
            <div class="photo-modal" style="max-width:90vw; max-height:90vh; background:transparent; position:relative;">
                <button class="news-modal-close" onclick="window.closeVideoModal()" style="position:absolute; top:-20px; right:-20px; background:#fff; border:none; width:44px; height:44px; border-radius:50%; font-size:28px; cursor:pointer; z-index:10;">&times;</button>
                <div style="position:relative; width:100%; padding-bottom:56.25%; height:0; overflow:hidden;">
                    <iframe src="${embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>
        `;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        overlay.onclick = function(e) {
            if (e.target === overlay) window.closeVideoModal();
        };
    };

    window.closeVideoModal = function() {
        const overlay = document.getElementById('videoModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            overlay.innerHTML = '';
        }
    };

    window.downloadPhoto = function(url, filename = 'photo.jpg') {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // ---------- ДОКУМЕНТЫ ----------
    async function loadDocuments() {
        const container = document.getElementById('documentBlocks');
        if (!container) return;

        if (isLocal()) {
            container.innerHTML = `
                <div class="doc-block" id="block-achiv" style="scroll-margin-top: 100px;">
                    <h3>Достижения</h3>
                    <div class="doc-list">
                        <div class="doc-item"><a href="#">Демо-документ 1</a></div>
                    </div>
                </div>
            `;
            return;
        }

        try {
            const resp = await fetch('document.txt');
            if (!resp.ok) throw new Error('document.txt not found');
            const text = await resp.text();
            const files = text.split('\n').filter(f => f.trim());
            const groups = {
                achiv: { label: 'Достижения', files: [] },
                rules: { label: 'Правила', files: [] },
                sovet: { label: 'Совет СКБ', files: [] },
                contr: { label: 'Договора', files: [] },
                artic: { label: 'Статьи', files: [] },
                draw: { label: 'Чертежи', files: [] }
            };
            files.forEach(file => {
                const parts = file.split('_');
                if (parts.length >= 3) {
                    const prefix = parts[0];
                    if (groups[prefix]) {
                        groups[prefix].files.push(file);
                    }
                }
            });

            let html = '';
            for (const [key, group] of Object.entries(groups)) {
                if (group.files.length === 0) continue;
                const sorted = group.files.sort((a,b) => {
                    const na = parseInt(a.split('_')[1]) || 0;
                    const nb = parseInt(b.split('_')[1]) || 0;
                    return na - nb;
                });
                html += `<div class="doc-block" id="block-${key}" style="scroll-margin-top: 100px;">
                    <h3>${group.label}</h3>
                    <div class="doc-list">
                        ${sorted.map(f => `
                            <div class="doc-item">
                                <a href="document/${f}" target="_blank" data-preview="${f}">${f.replace(/^[^_]*_\d+_/, '')}</a>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }
            container.innerHTML = html || '<p>Документы отсутствуют.</p>';
            initDocPreview();
        } catch (e) {
            container.innerHTML = '<p>Не удалось загрузить документы.</p>';
            console.warn(e);
        }
    }

    function initDocPreview() {
        const previewBlock = document.getElementById('docPreview');
        if (!previewBlock) return;
        const content = previewBlock.querySelector('.doc-preview-content');
        const items = document.querySelectorAll('.doc-item a[data-preview]');
        items.forEach(link => {
            link.addEventListener('mouseenter', function() {
                const fileName = this.dataset.preview;
                content.innerHTML = getPreviewHtml(fileName);
            });
        });
    }

    function getPreviewHtml(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const filePath = `document/${fileName}`;
        if (ext === 'pdf') {
            return `<object data="${filePath}#zoom=90&toolbar=0&navpanes=0&scrollbar=0" type="application/pdf" style="width:100%; height:100%; min-height:500px;"><p>Не удалось загрузить PDF</p></object>`;
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext)) {
            return `<img src="${filePath}" alt="Превью" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        } else {
            return `<div class="preview-placeholder" style="text-align:center; padding:20px;"><span style="font-size: 48px;">📄</span><br><span>Предпросмотр недоступен</span></div>`;
        }
    }

    // ---------- ИНИЦИАЛИЗАЦИЯ ----------
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('newsGrid') || document.getElementById('newsContainer')) loadNews();
        if (document.getElementById('partnersTrack')) loadPartners();
        if (document.getElementById('projectsHot') || document.getElementById('projectsGrid')) loadProjects();
        if (document.getElementById('galleryEvents')) loadGallery();
        if (document.getElementById('documentBlocks')) loadDocuments();
        setTimeout(updateCrossbar, 500);
    });

})();
