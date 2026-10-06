// ==================== APP INITIALIZATION & NAVIGATION ====================

function showPage(pageId) {
  console.log("Navigating to:", pageId);
  
  // 1. Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
    page.style.display = 'none'; // Ensure they are truly hidden
  });
  
  // 2. Show target page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    targetPage.style.display = 'block';
  } else {
    console.error("Page not found:", pageId);
    const landing = document.getElementById('landing');
    if (landing) {
      landing.classList.add('active');
      landing.style.display = 'block';
    }
    pageId = 'landing';
  }
  
  // 3. Update Tab Buttons (the bottom ones)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });
  
  // 4. Update Top Nav Links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const onclickStr = link.getAttribute('onclick') || "";
    // Match based on showPage('pageId')
    if (onclickStr.includes(`'${pageId}'`) || onclickStr.includes(`"${pageId}"`)) {
      link.classList.add('active');
    }
  });

  // 5. Page-Specific Logic
  if (pageId === 'citizen-dashboard') {
    // Wait for display:block to take effect for Leaflet
    setTimeout(() => {
      if (typeof initMap === 'function') initMap();
      if (typeof renderReports === 'function') renderReports();
      if (typeof updateDashboardStats === 'function') updateDashboardStats();
    }, 100);
  }

  // 6. Scroll to top & Reset animations
  window.scrollTo({ top: 0, behavior: 'instant' });
  setTimeout(checkScrollAnimations, 100);
}

function switchTab(btn, pageId) {
  showPage(pageId);
}

function checkScrollAnimations() {
  document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale').forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight * 0.85) {
      element.classList.add('active');
    }
  });
}

function openReportModal() { 
  document.getElementById('reportModal').classList.add('active'); 
  resetReportModal(); 
}

function closeReportModal() { 
  document.getElementById('reportModal').classList.remove('active'); 
}

function resetReportModal() {
  document.getElementById('uploadStep').style.display = 'block';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('loadingState').style.display = 'none';
  const validationMessage = document.getElementById('validationMessage');
  if (validationMessage) validationMessage.textContent = '';
  document.getElementById('potholeInput').value = '';
}

// ==================== EVENT LISTENERS ====================

window.addEventListener('scroll', () => {
  const topNav = document.getElementById('topNav');
  const pageTabs = document.getElementById('pageTabs');
  if (window.scrollY > 50) {
    if (topNav) topNav.classList.add('scrolled');
    if (pageTabs) pageTabs.classList.add('scrolled');
  } else {
    if (topNav) topNav.classList.remove('scrolled');
    if (pageTabs) pageTabs.classList.remove('scrolled');
  }
  checkScrollAnimations();
});

document.addEventListener('DOMContentLoaded', () => {
  checkScrollAnimations();
  document.querySelectorAll('.card, .bento-card, .financing-card, .stat-card, .report-item').forEach((el, index) => {
    el.classList.add('scroll-reveal');
    el.classList.add(`stagger-${(index % 4) + 1}`);
  });
  renderReports();
});

// Sidebar item interaction
document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', function() {
    this.closest('.sidebar').querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

// Progress bar intersection observer
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.progress-fill').forEach(fill => {
        const width = fill.style.width;
        fill.style.width = '0%';
        setTimeout(() => { 
          fill.style.width = width; 
        }, 100);
      });
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.card, .section').forEach(section => progressObserver.observe(section));
