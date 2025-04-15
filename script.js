// blog/script.js

// --- State Variables ---
let currentSlide = 0;
let slideItems = [];
let indicators = [];
let slideCount = 0;
let slidesContainer = null; // Will be selected after DOM ready
let sliderAutoPlayInterval = null;
const autoPlayDelay = 5000;

// --- Element Selectors (Global scope for convenience, selected after DOM ready/load) ---
let desktopNavEl = null;
let mobileNavLinksEl = null;
let mobileMenuToggleBtn = null;
let mobileNavContainer = null;
let slidesContainerEl = null;
let indicatorsContainerEl = null;
let contentPostSectionEl = null;
let modalEl = null; // Note: Modal might be unused now
let modalTitleEl = null;
let modalBodyEl = null;
let modalCloseBtn = null;
let overlayEl = null;
let contactForm = null;
let formStatus = null;
let darkToggleBtn = null;
let slidePrevBtn = null;
let slideNextBtn = null;

// --- Functions ---

/**
 * Fetches content from a URL. Handles both HTML and JSON.
 * @param {string} url - The URL of the resource to fetch.
 * @param {string} [type='html'] - The expected content type ('html' or 'json').
 * @returns {Promise<string|object|null>} - The fetched content (string for HTML, object for JSON) or null on error.
 */
async function fetchContent(url, type = 'html') {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
		}
		if (type === 'json') {
			return await response.json();
		} else {
			return await response.text();
		}
	} catch (error) {
		console.error(`Error loading content from ${url}:`, error);
		return null; // Indicate failure
	}
}

/**
 * Loads HTML component into a placeholder. Uses fetchContent.
 * @param {string} url - The URL of the HTML file.
 * @param {string} placeholderId - The ID of the placeholder element.
 * @returns {Promise<boolean>} - True on success, false on failure.
 */
async function loadComponent(url, placeholderId) {
	const htmlContent = await fetchContent(url, 'html');
	const placeholder = document.getElementById(placeholderId);

	if (placeholder) {
		if (htmlContent !== null) {
			placeholder.innerHTML = htmlContent;
			return true;
		} else {
			placeholder.innerHTML = `<p style="color: red; text-align: center;">Error loading component ${url}.</p>`;
			return false;
		}
	} else {
		console.error(`Placeholder element #${placeholderId} not found.`);
		return false;
	}
}


/**
 * Updates the visual state of slider indicators.
 */
function updateIndicators() {
	// Important: Check if indicators exist before proceeding
	if (!indicators || indicators.length === 0 || indicators.length !== slideCount) return;
	indicators.forEach((indicator, idx) => {
		indicator.setAttribute('aria-selected', idx === currentSlide ? 'true' : 'false');
		indicator.setAttribute('tabindex', idx === currentSlide ? '0' : '-1');
		indicator.classList.toggle('active', idx === currentSlide);
	});
	// Check if slideItems exist
	if (slideItems && slideItems.length > 0) {
		slideItems.forEach((slide, idx) => {
			if (slide) { // Check individual slide item
				slide.setAttribute('aria-hidden', idx !== currentSlide ? 'true' : 'false');
			}
		});
	}
}

/**
 * Moves the slider to the next or previous slide.
 */
function moveSlide(direction) {
	// Check essential elements exist
	if (!slidesContainerEl || slideCount <= 1) return;
	const newSlideIndex = (currentSlide + direction + slideCount) % slideCount;
	goToSlide(newSlideIndex);
}

/**
 * Jumps the slider directly to a specific slide index.
 */
function goToSlide(index) {
	// Check essential elements exist and index is valid
	if (!slidesContainerEl || index < 0 || index >= slideCount || slideCount <= 1 || index === currentSlide) return;
	currentSlide = index;
	slidesContainerEl.style.transform = `translateX(-${currentSlide * 100}%)`;
	updateIndicators(); // updateIndicators will check for indicators array itself
}

function startSliderAutoPlay() {
	if (slideCount <= 1 || sliderAutoPlayInterval || !slidesContainerEl) return; // Check if slider exists
	sliderAutoPlayInterval = setInterval(() => moveSlide(1), autoPlayDelay);
}

function stopSliderAutoPlay() {
	clearInterval(sliderAutoPlayInterval);
	sliderAutoPlayInterval = null;
}

/**
 * Stops autoplay before manual interaction, then performs the action.
 */
function handleSliderInteraction(action, ...args) {
	stopSliderAutoPlay();
	action(...args);
	// Optional: Restart autoplay after a delay if desired
	// setTimeout(startSliderAutoPlay, autoPlayDelay * 2);
}

/**
 * Toggles between light and dark mode themes.
 */
function toggleDarkMode() {
	const body = document.body;
	if (!body) return; // Body should always exist, but good practice
	const isDarkMode = !body.classList.contains('dark-mode');
	body.classList.toggle('dark-mode');
	localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
	// Update button text if it exists
	darkToggleBtn = darkToggleBtn || document.querySelector('.dark-toggle'); // Ensure selected
	if (darkToggleBtn) {
		darkToggleBtn.textContent = isDarkMode ? '라이트 모드' : '다크 모드';
		darkToggleBtn.setAttribute('aria-label', isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환');
	}
}

/**
 * Applies the theme (dark/light) based on localStorage or system preference.
 */
function applySavedTheme() {
	const savedTheme = localStorage.getItem('theme');
	const body = document.body;
	if (!body) return;
	const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	let currentThemeIsDark = false;

	if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
		body.classList.add('dark-mode');
		currentThemeIsDark = true;
	} else {
		body.classList.remove('dark-mode');
		currentThemeIsDark = false;
	}

	// Update button text after ensuring it's selected
	darkToggleBtn = darkToggleBtn || document.querySelector('.dark-toggle');
	if (darkToggleBtn) {
		darkToggleBtn.textContent = currentThemeIsDark ? '라이트 모드' : '다크 모드';
		darkToggleBtn.setAttribute('aria-label', currentThemeIsDark ? '라이트 모드로 전환' : '다크 모드로 전환');
	}
}

/**
 * Toggles the visibility of the mobile navigation menu.
 */
function toggleMobileMenu() {
	// Ensure header elements are loaded and selected
	mobileMenuToggleBtn = mobileMenuToggleBtn || document.querySelector('#header-placeholder header .mobile-menu-toggle');
	mobileNavContainer = mobileNavContainer || document.querySelector('#header-placeholder header #mobileNavContainer');

	if (!mobileMenuToggleBtn || !mobileNavContainer) {
		console.error("Mobile menu toggle button or container not found. Header might not be loaded or structured correctly.");
		return;
	}
	const isOpening = !document.body.classList.contains('menu-open');
	document.body.classList.toggle('menu-open');
	mobileMenuToggleBtn.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
	mobileNavContainer.setAttribute('aria-hidden', isOpening ? 'false' : 'true');

	overlayEl = overlayEl || document.getElementById('menuOverlay'); // Ensure overlay is selected
	if (overlayEl) {
		overlayEl.style.zIndex = isOpening ? '1000' : '99'; // Adjust z-index for menu
	}


	if (isOpening) {
		// Focus management
		const firstFocusableElement = mobileNavContainer.querySelector('a, button');
		firstFocusableElement?.focus();
	} else {
		mobileMenuToggleBtn.focus();
	}
}

// --- Modal Functions (Might be unused, keep for now or remove if confirmed unnecessary) ---
/**
 * Opens the project detail modal. (Likely unused now)
 */
function openModal(title, details) {
	// Ensure modal elements exist
	modalEl = modalEl || document.getElementById('projectModal');
	modalTitleEl = modalTitleEl || document.getElementById('modalTitle');
	modalBodyEl = modalBodyEl || document.getElementById('modalBody');
	overlayEl = overlayEl || document.getElementById('menuOverlay');
	modalCloseBtn = modalCloseBtn || document.querySelector('#projectModal .modal-close-btn');

	if (!modalEl || !modalTitleEl || !modalBodyEl || !overlayEl || !modalCloseBtn) {
		console.warn("Modal elements not found. Cannot open modal.");
		return;
	}
	modalTitleEl.textContent = title;
	modalBodyEl.innerHTML = details;
	modalEl.classList.add('is-open');
	modalEl.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
	overlayEl.style.zIndex = '1040'; // Higher z-index for modal overlay
	modalCloseBtn.focus();
	stopSliderAutoPlay(); // Stop slider if modal opens
}

/**
 * Closes the project detail modal. (Likely unused now)
 */
function closeModal() {
	modalEl = modalEl || document.getElementById('projectModal');
	overlayEl = overlayEl || document.getElementById('menuOverlay');

	if (!modalEl || !overlayEl) return;
	modalEl.classList.remove('is-open');
	modalEl.setAttribute('aria-hidden', 'true');
	document.body.classList.remove('modal-open');
	overlayEl.style.zIndex = '99'; // Reset overlay z-index
	startSliderAutoPlay(); // Restart slider if modal closes
}
// --- End Modal Functions ---


/**
 * Initializes Intersection Observer for scroll fade-in effects.
 */
function initializeScrollFadeIn() {
	// 모든 스크롤 효과 대상 요소를 선택
	const scrollFadeElements = document.querySelectorAll('.js-scroll-fade-in, .scroll-fade-image');

	// IntersectionObserver 지원 여부 및 대상 요소 존재 여부 확인
	if (!('IntersectionObserver' in window) || !scrollFadeElements || scrollFadeElements.length === 0) {
		console.warn("IntersectionObserver not supported or no elements for scroll effects found. Showing all elements.");
		// 지원 안하거나 요소 없으면 즉시 보이게 처리 (Fallback)
		if (scrollFadeElements) {
			scrollFadeElements.forEach(el => {
				el.style.opacity = 1;
				// transform 초기화 (translateX, translateY, scale 모두 고려)
				el.style.transform = 'translate(0, 0) scale(1)';
				el.classList.add('is-visible'); // 활성 클래스 추가
			});
		}
		return; // 함수 종료
	}

	// Observer 설정값
	const observerOptions = {
		root: null, // 뷰포트를 기준으로 감지
		rootMargin: '0px 0px -50px 0px', // 화면 하단에서 50px 위에서부터 감지 시작 (조절 가능)
		threshold: 0.1 // 요소가 10% 보였을 때 실행 (조절 가능)
	};

	// Observer 콜백 함수: 요소가 화면에 들어오면 실행됨
	const observerCallback = (entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) { // 요소가 화면에 보이는지 확인
				entry.target.classList.add('is-visible'); // 활성화 클래스 추가
				observer.unobserve(entry.target); // 한 번 효과가 적용되면 더 이상 감지하지 않음
			}
		});
	};

	// Intersection Observer 인스턴스 생성
	const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);

	// 각 대상 요소를 Observer에 등록하여 감지 시작
	scrollFadeElements.forEach(el => {
		scrollObserver.observe(el);
	});

	console.log(`Initialized scroll fade effects for ${scrollFadeElements.length} elements.`);
}

/**
 * Generates navigation links in both desktop and mobile menus based on project data.
 * Links now point to project-detail.html with query parameters.
 * @param {Array} projectData - Array of project objects.
 */
function generateNavigationLinks(projectData) {
	// Ensure header elements are loaded first (happens in DOMContentLoaded)
	desktopNavEl = document.querySelector('#header-placeholder header nav#desktopNav');
	mobileNavLinksEl = document.querySelector('#header-placeholder header #mobileNavLinks');

	if (!desktopNavEl || !mobileNavLinksEl) {
		// This might happen if header loading fails, log error but don't stop script
		console.error("Navigation containers (#desktopNav or #mobileNavLinks) not found within #header-placeholder. Header might have failed to load.");
		return; // Stop generating links if containers aren't there
	}
	if (!projectData || projectData.length === 0) {
		console.warn("No project data provided for navigation.");
		// Optionally add a default link or message
		// desktopNavEl.innerHTML = '<li>No projects</li>';
		// mobileNavLinksEl.innerHTML = '<li>No projects</li>';
		return;
	}

	desktopNavEl.innerHTML = ''; // Clear existing links
	mobileNavLinksEl.innerHTML = ''; // Clear existing links

	projectData.forEach((project) => {
		// 상세 페이지 URL 생성 (예: project-detail.html?id=project1)
		const detailPageUrl = `project-detail.html?id=${project.id}`;

		// 데스크탑 네비게이션 링크 생성
		const desktopLink = document.createElement('a');
		desktopLink.href = detailPageUrl;
		desktopLink.textContent = project.title || `Project ${project.id}`; // Use title, fallback to ID
		desktopNavEl.appendChild(desktopLink);

		// 모바일 네비게이션 링크 생성
		const mobileLink = document.createElement('a');
		mobileLink.href = detailPageUrl;
		mobileLink.textContent = project.title || `Project ${project.id}`;
		mobileLink.addEventListener('click', () => {
			// 링크 클릭 시 모바일 메뉴 닫기 (메뉴가 열려있을 때만)
			if (document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
			// 페이지 이동은 a 태그의 기본 href 동작에 맡김
		});
		mobileNavLinksEl.appendChild(mobileLink);
	});
}


/**
 * Generates slider slides and indicators based on project data.
 * The "자세히 보기" link now points to project-detail.html.
 * Only runs if the slider container exists.
 * @param {Array} projectData - Array of project objects.
 */
function generateSliderContent(projectData) {
	// *** Check if slider exists on the current page ***
	const sliderElement = document.querySelector('.slider');
	if (!sliderElement) {
		// console.log("Slider element not found on this page. Skipping slider generation.");
		return; // Exit if no slider element
	}

	// Select elements within the slider
	slidesContainerEl = sliderElement.querySelector('#slidesContainer');
	indicatorsContainerEl = sliderElement.querySelector('#indicators');
	slidePrevBtn = sliderElement.querySelector('.slide-btn.prev');
	slideNextBtn = sliderElement.querySelector('.slide-btn.next');

	// Check if essential inner elements are found
	if (!slidesContainerEl || !indicatorsContainerEl || !slidePrevBtn || !slideNextBtn) {
		console.error("Slider inner containers (#slidesContainer, #indicators) or buttons (.slide-btn) not found within .slider.");
		// Hide the slider section if parts are missing to avoid broken UI
		sliderElement.style.display = 'none';
		return;
	}

	if (!projectData || projectData.length === 0) {
		console.warn("No project data provided for slider.");
		// Hide the slider section if no data
		sliderElement.style.display = 'none';
		return;
	}

	// Clear previous content
	slidesContainerEl.innerHTML = '';
	indicatorsContainerEl.innerHTML = '';
	slideItems = [];
	indicators = [];

	projectData.forEach((project, index) => {
		// Create slide item
		const slideItem = document.createElement('div');
		slideItem.id = `slide-${project.id}`;
		slideItem.classList.add('slide-item');
		slideItem.setAttribute('role', 'group');
		slideItem.setAttribute('aria-roledescription', 'slide');
		slideItem.setAttribute('aria-label', `${index + 1} / ${projectData.length}`);
		slideItem.setAttribute('aria-hidden', index !== 0 ? 'true' : 'false'); // Set initial hidden state

		// Create image
		const img = document.createElement('img');
		img.src = project.sliderImage || 'image/placeholder.png'; // Fallback image
		img.alt = project.altText || `Slide ${index + 1}`;
		img.loading = 'lazy';
		img.decoding = 'async';
		slideItem.appendChild(img);

		// Create caption
		const caption = document.createElement('div');
		caption.classList.add('slide-caption');
		const captionTitle = document.createElement('h3');
		captionTitle.textContent = project.sliderTitle || project.title; // Use sliderTitle or title
		caption.appendChild(captionTitle);

		// Create "자세히 보기" link pointing to detail page
		const detailsLink = document.createElement('a');
		detailsLink.href = `project-detail.html?id=${project.id}`; // Link to detail page
		detailsLink.textContent = '자세히 보기';
		detailsLink.classList.add('details-link');
		caption.appendChild(detailsLink);
		slideItem.appendChild(caption);

		slidesContainerEl.appendChild(slideItem);
		slideItems.push(slideItem);

		// Create indicator button if more than one slide
		if (projectData.length > 1) {
			const indicator = document.createElement('button');
			indicator.classList.add('indicator');
			indicator.setAttribute('role', 'tab');
			indicator.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
			indicator.setAttribute('aria-controls', slideItem.id);
			indicator.setAttribute('aria-label', `프로젝트 ${index + 1} 보기: ${project.sliderTitle || project.title}`);
			indicator.setAttribute('tabindex', index === 0 ? '0' : '-1');
			if (index === 0) indicator.classList.add('active');

			indicator.addEventListener('click', () => handleSliderInteraction(goToSlide, index));
			indicatorsContainerEl.appendChild(indicator);
			indicators.push(indicator);
		}
	});

	slideCount = slideItems.length;

	// Show/hide buttons and indicators based on slide count
	const displayStyle = slideCount <= 1 ? 'none' : 'flex';
	slidePrevBtn.style.display = displayStyle;
	slideNextBtn.style.display = displayStyle;
	indicatorsContainerEl.style.display = slideCount <= 1 ? 'none' : 'flex';

	// Initialize slider position and indicators if slides exist
	if (slideCount > 0) {
		slidesContainerEl.style.transform = `translateX(0%)`; // Reset transform
		if (slideCount > 1) {
			updateIndicators(); // Update indicators state
		}
	}
}


/**
 * Generates content post elements in the designated section.
 * Only runs if the content post section exists.
 * @param {Array} postData - Array of post objects.
 */
function generateContentPosts(postData) {
	// *** Check if content post section exists on the current page ***
	contentPostSectionEl = document.getElementById('contentPostSection');
	if (!contentPostSectionEl) {
		// console.log("Content post section (#contentPostSection) not found on this page. Skipping post generation.");
		return; // Exit if no section element
	}

	if (!postData || postData.length === 0) {
		console.warn("No content post data provided.");
		// Optionally hide the section or show a message
		contentPostSectionEl.innerHTML = '<p>게시물이 없습니다.</p>';
		return;
	}

	contentPostSectionEl.innerHTML = ''; // Clear previous content

	postData.forEach(post => {
		const postContainer = document.createElement('div');
		postContainer.classList.add('post', 'js-scroll-fade-in'); // Add fade-in class
		postContainer.setAttribute('role', 'button'); // Make it seem interactive
		postContainer.setAttribute('tabindex', '0'); // Make it focusable
		postContainer.setAttribute('aria-haspopup', 'dialog'); // Indicate it opens a dialog (modal)

		// --- Event listeners to open the MODAL ---
		// *** If you are NOT using the modal anymore, REMOVE these listeners ***
		postContainer.addEventListener('click', () => openModal(post.title, post.details));
		postContainer.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openModal(post.title, post.details);
			}
		});
		// --- End Modal Listeners ---

		// Create image
		const img = document.createElement('img');
		img.src = post.imageSrc || 'image/placeholder.png'; // Fallback image
		img.alt = post.altText || post.title;
		img.loading = 'lazy';
		img.decoding = 'async';
		postContainer.appendChild(img);

		// Create text container
		const textDiv = document.createElement('div');
		textDiv.classList.add('post-text');
		const title = document.createElement('h3');
		title.textContent = post.title;
		textDiv.appendChild(title);
		const description = document.createElement('p');
		description.textContent = post.description;
		textDiv.appendChild(description);
		postContainer.appendChild(textDiv);

		contentPostSectionEl.appendChild(postContainer);
	});

	// After generating posts, re-initialize scroll fade-in for the new elements
	// NOTE: initializeScrollFadeIn() called once at the end might be better
}

/**
 * Handles the submission of the contact form using Fetch API.
 * Only runs if the contact form exists.
 */
async function handleFormSubmit(event) {
	event.preventDefault(); // Prevent default form submission

	// Form should already be selected in initializePageFunctionality if it exists
	const form = event.target; // The form that triggered the event
	if (!form) return; // Should not happen if attached correctly

	formStatus = formStatus || document.getElementById('formStatus'); // Select status element if not already selected
	if (!formStatus) {
		console.error("Form status element (#formStatus) not found.");
		return; // Exit if status element is missing
	}

	const data = new FormData(form); // Get form data

	formStatus.textContent = '전송 중...';
	formStatus.style.color = 'var(--text-color)'; // Reset color

	try {
		// Ensure Formspree endpoint is set in the form's action attribute
		if (!form.action || !form.action.includes('formspree.io')) {
			throw new Error("Formspree endpoint is not configured in the form's action attribute or is invalid.");
		}

		const response = await fetch(form.action, {
			method: form.method,
			body: data,
			headers: {'Accept': 'application/json'} // Tell Formspree to send JSON response
		});

		if (response.ok) {
			formStatus.textContent = '메시지가 성공적으로 전송되었습니다!';
			formStatus.style.color = 'green';
			form.reset(); // Clear the form
			setTimeout(() => { formStatus.textContent = ''; }, 5000); // Clear status after 5 seconds
		} else {
			// Try to parse error from Formspree JSON response
			let errorMessage = '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.';
			try {
				const responseData = await response.json();
				if (responseData && responseData.errors) {
					errorMessage = responseData.errors.map(error => error.message).join(", ");
				}
			} catch (jsonError) {
				// If response is not JSON or parsing fails, use default error
				console.error("Could not parse Formspree error response:", jsonError)
			}
			formStatus.textContent = errorMessage;
			formStatus.style.color = 'red';
		}
	} catch (error) {
		console.error("Form submission error:", error);
		formStatus.textContent = `메시지 전송 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`;
		formStatus.style.color = 'red';
	}
}

// --- Initialization Function ---

/**
 * Selects elements and attaches primary event listeners after the DOM is ready
 * and header/footer components are loaded.
 * **Crucially, checks if elements exist before attaching listeners.**
 */
function initializePageFunctionality() {
	console.log("Initializing page functionality...");

	// --- Select Common Elements (likely present on all pages) ---
	darkToggleBtn = document.querySelector('.dark-toggle');
	overlayEl = document.getElementById('menuOverlay');
	mobileMenuToggleBtn = document.querySelector('#header-placeholder header .mobile-menu-toggle');
	mobileNavContainer = document.querySelector('#header-placeholder header #mobileNavContainer');

	// --- Attach Listeners for Common Elements ---
	if (darkToggleBtn) {
		darkToggleBtn.addEventListener('click', toggleDarkMode);
	} else {
		console.warn("Dark toggle button not found.");
	}

	if (mobileMenuToggleBtn && mobileNavContainer) {
		mobileMenuToggleBtn.addEventListener('click', toggleMobileMenu);
	} else {
		console.warn("Mobile menu toggle or container not found. Mobile menu might not work.");
	}

	if (overlayEl) {
		overlayEl.addEventListener('click', () => {
			// Close modal OR mobile menu if overlay is clicked
			modalEl = modalEl || document.getElementById('projectModal'); // Select if needed
			if (modalEl && document.body.classList.contains('modal-open')) {
				closeModal();
			} else if (mobileNavContainer && document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		});
	} else {
		console.warn("Overlay element not found.");
	}

	// --- Select and Initialize Page-Specific Elements (Index Page) ---

	// Slider Initialization (Only if slider exists)
	const sliderElement = document.querySelector('.slider');
	if (sliderElement) {
		console.log("Slider found, initializing slider functionality...");
		slidePrevBtn = sliderElement.querySelector('.slide-btn.prev');
		slideNextBtn = sliderElement.querySelector('.slide-btn.next');
		slidesContainerEl = sliderElement.querySelector('#slidesContainer'); // Needed for touch events

		if (slidePrevBtn && slideNextBtn) {
			slidePrevBtn.addEventListener('click', () => handleSliderInteraction(moveSlide, -1));
			slideNextBtn.addEventListener('click', () => handleSliderInteraction(moveSlide, 1));

			// Autoplay and touch event listeners only if buttons exist (implies > 1 slide usually)
			if (slidesContainerEl && slideCount > 1) { // Check slideCount state
				sliderElement.addEventListener('mouseenter', stopSliderAutoPlay);
				sliderElement.addEventListener('mouseleave', startSliderAutoPlay);
				sliderElement.addEventListener('focusin', stopSliderAutoPlay);
				sliderElement.addEventListener('focusout', startSliderAutoPlay);

				// Basic Touch Swipe (Optional)
				let startX = 0;
				let isDragging = false;
				slidesContainerEl.addEventListener('touchstart', e => {
					if (slideCount <= 1) return;
					stopSliderAutoPlay();
					startX = e.touches[0].clientX;
					isDragging = true;
				}, { passive: true });

				slidesContainerEl.addEventListener('touchend', e => {
					if (!isDragging || slideCount <= 1) return;
					isDragging = false;
					const endX = e.changedTouches[0].clientX;
					const diff = endX - startX;
					const threshold = 50; // Min swipe distance

					if (diff > threshold) {
						handleSliderInteraction(moveSlide, -1); // Swipe right (prev)
					} else if (diff < -threshold) {
						handleSliderInteraction(moveSlide, 1); // Swipe left (next)
					}
					// Optional: Restart autoplay after swipe interaction delay
					// setTimeout(startSliderAutoPlay, autoPlayDelay * 2);
				}, { passive: true });
			}
		} else {
			console.warn("Slider buttons not found within .slider element.");
		}
		// Start autoplay only if slider exists and has more than one slide
		if (slideCount > 1) {
			startSliderAutoPlay();
		}

	} else {
		// console.log("Slider not found on this page.");
	}

	// Modal Initialization (Only if modal exists - might be unused)
	modalEl = document.getElementById('projectModal');
	if (modalEl) {
		console.log("Modal found, initializing modal functionality...");
		modalCloseBtn = modalEl.querySelector('.modal-close-btn');
		modalTitleEl = modalEl.querySelector('#modalTitle'); // Select inner parts
		modalBodyEl = modalEl.querySelector('#modalBody');

		if (modalCloseBtn) {
			modalCloseBtn.addEventListener('click', closeModal);
		} else {
			console.warn("Modal close button not found inside #projectModal.");
		}
		// Note: Event listeners for opening the modal are attached in generateContentPosts
	} else {
		// console.log("Modal not found on this page.");
	}

	// Contact Form Initialization (Only if form exists)
	contactForm = document.getElementById('contactForm');
	if (contactForm) {
		console.log("Contact form found, initializing form submission handler...");
		formStatus = document.getElementById('formStatus'); // Select status element associated with the form
		if (!formStatus){
			console.warn("Form status element (#formStatus) not found. Submission status messages will not be displayed.");
		}
		contactForm.addEventListener('submit', handleFormSubmit);
	} else {
		// console.log("Contact form not found on this page.");
	}

	// --- Global Event Listeners ---
	window.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			// Close modal OR mobile menu if Escape is pressed
			modalEl = modalEl || document.getElementById('projectModal'); // Ensure selected
			if (modalEl && document.body.classList.contains('modal-open')) {
				closeModal();
			} else if (mobileNavContainer && document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		}
	});


	// --- Footer Date Update (Common element, likely exists) ---
	// Use try-catch for safety in case footer fails to load
	try {
		const copyrightYearEl = document.getElementById('copyrightYear');
		const updateDateEl = document.getElementById('updateDate');
		if (copyrightYearEl) {
			copyrightYearEl.textContent = new Date().getFullYear();
		}
		if (updateDateEl) {
			// More robust date formatting
			updateDateEl.textContent = new Date().toLocaleDateString('ko-KR', {
				year: 'numeric', month: 'long', day: 'numeric'
			});
		}
	} catch (e) {
		console.warn("Could not update footer dates:", e);
	}


	console.log("Page functionality initialization complete.");
}


// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', async () => {
	console.log("DOM fully loaded and parsed.");

	// 1. Apply theme immediately (doesn't depend on external data/components)
	applySavedTheme();

	// 2. Load data, header, and footer concurrently
	const dataPromise = fetchContent('data.json', 'json');
	const headerPromise = loadComponent('_header.html', 'header-placeholder');
	const footerPromise = loadComponent('_footer.html', 'footer-placeholder');

	// 3. Wait for all essential content (data, header, footer) to load
	try {
		// Wait for all promises to resolve
		const [siteData, headerLoaded, footerLoaded] = await Promise.all([dataPromise, headerPromise, footerPromise]);

		// Check if components loaded successfully (log errors but continue if possible)
		if (!headerLoaded) console.error("Header component (_header.html) failed to load. Navigation might be broken.");
		if (!footerLoaded) console.error("Footer component (_footer.html) failed to load.");

		// Check if data loaded successfully (critical failure)
		if (siteData === null) {
			throw new Error("Failed to load site data (data.json). Cannot generate dynamic content.");
		}

		// Extract data (ensure structure is as expected)
		const projects = siteData.projects || []; // Use empty array as fallback
		const contentPosts = siteData.contentPosts || [];

		// --- Generate Dynamic Content (using loaded data) ---
		// Only generate navigation if header loaded successfully
		if (headerLoaded) {
			generateNavigationLinks(projects); // Pass projects data
		}
		// Generate slider and posts (these functions check if their containers exist)
		generateSliderContent(projects);     // Pass projects data
		generateContentPosts(contentPosts); // Pass contentPosts data

		// 4. Initialize all interactive components and event listeners
		//    This runs AFTER dynamic elements (nav, slider, posts) might have been created.
		initializePageFunctionality();

		// 5. Initialize scroll effects AFTER everything else is set up and potentially added to DOM
		initializeScrollFadeIn();

	} catch (error) {
		console.error("Critical error during page initialization:", error);
		// Display a user-friendly error message on the page for critical failures
		const body = document.body || document.createElement('body'); // Ensure body exists
		// Clear potentially broken content and show error
		body.innerHTML = `<div style="color: red; text-align: center; padding: 50px; font-family: sans-serif;">
                            <h1>페이지 로딩 오류</h1>
                            <p>페이지를 표시하는 데 필요한 데이터를 불러오지 못했습니다.</p>
                            <p>나중에 다시 시도해주시기 바랍니다.</p>
                            <p style="font-size: 0.8em; color: #555;">오류: ${error.message}</p>
                          </div>`;
		// Manually apply theme to error message background if possible
		applySavedTheme();
	}
});