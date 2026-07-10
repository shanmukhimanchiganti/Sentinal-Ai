/**
 * Sentinel AI - Core Application Logic (Expanded Version)
 * Implements authentication walls, header global search indexing, cascading error trees,
 * interactive SVGs, responsive charts, and chatbot operations parsing.
 */

// Global Chart Instances
let healthGaugeChart = null;
let apiLatencyChart = null;
let revenueLossChart = null;
let customerComplaintsChart = null;

// Chatbot history logs
let chatHistory = [];
let currentExecutingAutoAction = null;
let userIsAuthenticated = false;

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  // Setup clock
  updateClock();
  setInterval(updateClock, 1000);
  
  // Setup Navigation switching
  setupNavigation();
  
  // Setup Chatbot defaults
  initChatbot();

  // Highlight active sidebar item
  window.addEventListener('hashchange', handleRouting);
  
  // Close search results overlay when clicking outside
  document.addEventListener('click', (e) => {
    const searchOverlay = document.getElementById('search-results-overlay');
    const searchInput = document.getElementById('global-search-input');
    if (searchOverlay && !searchOverlay.contains(e.target) && e.target !== searchInput) {
      searchOverlay.classList.remove('active');
    }
  });
  
  // Check auth
  checkAuthenticationState();
});

// Authentication handlers
function checkAuthenticationState() {
  const loginOverlay = document.getElementById('login-screen');
  if (!userIsAuthenticated) {
    loginOverlay.classList.remove('hidden');
  } else {
    loginOverlay.classList.add('hidden');
    refreshAllViews();
  }
}

function fillDemoCredentials() {
  document.getElementById('login-email').value = 'sre-lead@sentinel.ai';
  document.getElementById('login-password').value = 'admin';
}

function validateSreLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const errMsg = document.getElementById('login-error-msg');
  
  if (email === 'sre-lead@sentinel.ai' && pass === 'admin') {
    errMsg.style.display = 'none';
    userIsAuthenticated = true;
    
    // Hide login screen
    const loginOverlay = document.getElementById('login-screen');
    loginOverlay.classList.add('hidden');
    
    showToast("Session Authorized", "Welcome back, Lead SRE Manager S. Agrawal.", "healthy");
    refreshAllViews();
  } else {
    errMsg.style.display = 'block';
    showToast("Authorization Failed", "Invalid credentials. Audit log generated.", "critical");
  }
}

// Clock Implementation
function updateClock() {
  const clockEl = document.getElementById('live-clock');
  if (clockEl) {
    const now = new Date();
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZoneName: 'short'
    };
    clockEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleString('en-US', options)}`;
  }
}

// Navigation Routing
function setupNavigation() {
  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      
      // Update sidebar state
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');
      
      // Switch active view
      const views = document.querySelectorAll('.view-section');
      views.forEach(v => v.classList.remove('active'));
      
      const targetView = document.getElementById(`view-${target}`);
      if (targetView) {
        targetView.classList.add('active');
      }
      
      // Update breadcrumb
      const breadcrumbText = item.querySelector('span').innerText;
      document.getElementById('breadcrumb-current').innerText = breadcrumbText;
      
      // Trigger target-specific initializations
      onViewChanged(target);
    });
  });
}

function handleRouting() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const menuItem = document.querySelector(`.sidebar-menu .menu-item[data-target="${hash}"]`);
  if (menuItem) {
    menuItem.click();
  }
}

function onViewChanged(view) {
  if (view === 'dashboard' || view === 'impact') {
    setTimeout(() => {
      renderDashboardCharts();
    }, 100);
  }
  if (view === 'graph') {
    setTimeout(renderKnowledgeGraph, 100);
  }
}

// Global Header Search Handler
function handleGlobalSearch(query) {
  const overlay = document.getElementById('search-results-overlay');
  if (!overlay) return;
  
  const q = query.trim().toLowerCase();
  if (!q) {
    overlay.classList.remove('active');
    return;
  }
  
  overlay.classList.add('active');
  overlay.innerHTML = ''; // Clear previous
  
  // Query datasets
  const alerts = SentinelData.getAlerts();
  const incidents = SentinelData.getIncidents();
  const sources = SentinelData.getDataSources();
  
  const matchingIncidents = incidents.filter(i => 
    i.id.toLowerCase().includes(q) || 
    i.title.toLowerCase().includes(q) || 
    i.rootCause.toLowerCase().includes(q)
  );
  
  const matchingAlerts = alerts.filter(a => 
    a.id.toLowerCase().includes(q) || 
    a.source.toLowerCase().includes(q) || 
    a.message.toLowerCase().includes(q)
  );
  
  const matchingSources = sources.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.category.toLowerCase().includes(q)
  );
  
  let html = '';
  
  // 1. Incidents matches
  if (matchingIncidents.length > 0) {
    html += `
      <div class="search-result-category">
        <span class="search-result-cat-title">Incidents Match (${matchingIncidents.length})</span>
        <div class="search-result-list">
          ${matchingIncidents.map(inc => `
            <div class="search-result-item" onclick="viewIncidentFromSearch('${inc.id}')">
              <span class="search-result-name">${inc.id} – ${inc.title}</span>
              <span class="badge ${inc.severity === 'Critical' ? 'critical' : 'warning'}">${inc.severity}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // 2. Alerts matches
  if (matchingAlerts.length > 0) {
    html += `
      <div class="search-result-category">
        <span class="search-result-cat-title">Alert Logs Match (${matchingAlerts.length})</span>
        <div class="search-result-list">
          ${matchingAlerts.map(alt => `
            <div class="search-result-item" onclick="viewAlertFromSearch()">
              <span class="search-result-name">${alt.id} – ${alt.source}</span>
              <span>${alt.message.substring(0, 45)}...</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // 3. Data sources matches
  if (matchingSources.length > 0) {
    html += `
      <div class="search-result-category">
        <span class="search-result-cat-title">Connected Connectors Match (${matchingSources.length})</span>
        <div class="search-result-list">
          ${matchingSources.map(src => `
            <div class="search-result-item" onclick="viewSourcesFromSearch()">
              <span class="search-result-name">${src.name} (${src.category})</span>
              <span class="badge ${src.status === 'Connected' ? 'healthy' : 'critical'}">${src.status}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  if (!html) {
    overlay.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted); text-align:center;">No matching data parameters located.</span>`;
  } else {
    overlay.innerHTML = html;
  }
}

function viewIncidentFromSearch(incId) {
  document.getElementById('search-results-overlay').classList.remove('active');
  document.getElementById('global-search-input').value = '';
  
  // Navigate to Incidents tab
  document.querySelector('[data-target="incidents"]').click();
  setTimeout(() => {
    openIncidentModal(incId);
  }, 150);
}

function viewAlertFromSearch() {
  document.getElementById('search-results-overlay').classList.remove('active');
  document.getElementById('global-search-input').value = '';
  document.querySelector('[data-target="alerts"]').click();
}

function viewSourcesFromSearch() {
  document.getElementById('search-results-overlay').classList.remove('active');
  document.getElementById('global-search-input').value = '';
  document.querySelector('[data-target="sources"]').click();
}

// Toast Notifications
function showToast(title, message, priority = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${priority.toLowerCase()}`;
  
  let iconClass = 'fa-circle-info';
  if (priority.toLowerCase() === 'critical') iconClass = 'fa-circle-radiation';
  if (priority.toLowerCase() === 'warning') iconClass = 'fa-triangle-exclamation';
  if (priority.toLowerCase() === 'healthy') iconClass = 'fa-circle-check';
  
  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <span class="toast-msg">${message}</span>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Toggle Cascading Outage Simulation
function toggleSimulation() {
  const isSimulating = SentinelData.getSimulationState();
  const btn = document.getElementById('btn-simulate');
  const btnText = document.getElementById('simulate-btn-text');
  const explainRcBtn = document.getElementById('btn-explain-rootcause');
  
  if (!isSimulating) {
    // Enable simulation (cascading failure starts)
    SentinelData.setSimulationState(true);
    btn.classList.add('active');
    btnText.innerText = "Revert Cascading Outage";
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #047857 100%)';
    btn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
    
    explainRcBtn.style.display = 'inline-flex';
    document.getElementById('bell-badge').style.display = 'block';
    
    showToast("Cascading Telemetry Anomaly Detected", "Sentinel AI isolated 5 interconnected SRE logs", "critical");
    
    setTimeout(() => {
      showToast("Root Cause Identified", "Click 'Explain Root Cause' to view the cascading dependency path.", "warning");
    }, 1800);
    
    // Check if auto-remediation is enabled in settings
    const autoEnabled = document.getElementById('settings-enable-automation').checked;
    if (autoEnabled) {
      setTimeout(() => {
        showToast("Autonomous Action Triggered", "Executing all mitigations autonomously...", "info");
        executeAllMitigationsAutonomously();
      }, 4000);
    }
  } else {
    // Disable/reset simulation
    SentinelData.setSimulationState(false);
    btn.classList.remove('active');
    btnText.innerText = "Simulate Payment Failure";
    btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
    btn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
    
    explainRcBtn.style.display = 'none';
    document.getElementById('bell-badge').style.display = 'none';
    showToast("Simulation Reset", "Enterprise payment gateway restored. Metrics stabilized.", "healthy");
  }
  
  refreshAllViews();
}

// Refresh / Update views
function refreshAllViews() {
  if (!userIsAuthenticated) return;
  updateDashboardMetrics();
  updateTimeline();
  updateAlertsTable();
  updateIncidentsTable();
  updateDashboardAlerts();
  updateDashboardAIRecommendations();
  updateAIInsightsView();
  updateAutomationPage();
  updateDataSourcesView();
  renderDashboardCharts();
  renderKnowledgeGraph();
  updateChatbotSuggestions();
}

// Update Dashboard Summary metrics cards
function updateDashboardMetrics() {
  const metrics = SentinelData.getSystemMetrics();
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  const container = document.getElementById('dashboard-metrics-grid');
  if (!container) return;
  
  let incidentsClass = metrics.activeIncidents > 0 ? 'critical' : 'healthy';
  let alertsClass = metrics.criticalAlerts > 0 ? 'critical' : 'healthy';
  let riskClass = metrics.revenueAtRiskNumeric > 0 ? 'critical' : 'healthy';
  if (isSim && !failure.stripeOutage && metrics.revenueAtRiskNumeric > 0) {
    riskClass = 'warning';
  }
  
  container.innerHTML = `
    <div class="metric-card info">
      <div class="metric-header">
        <span>Connected Systems</span>
        <i class="fa-solid fa-server metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${metrics.totalSystemsConnected} / 10</span>
        <div class="metric-footer">
          <span class="metric-change up"><i class="fa-solid fa-link"></i> Live</span>
          <span class="metric-label-small">API Connectors</span>
        </div>
      </div>
    </div>
    
    <div class="metric-card ${metrics.healthyServices < 10 ? 'warning' : 'healthy'}">
      <div class="metric-header">
        <span>Healthy Services</span>
        <i class="fa-solid fa-circle-check metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${metrics.healthyServices} / 10</span>
        <div class="metric-footer">
          <span class="metric-change ${metrics.healthyServices < 10 ? 'down' : 'up'}">
            ${metrics.healthyServices < 10 ? '<i class="fa-solid fa-arrow-down-long"></i> Outage' : '<i class="fa-solid fa-arrow-up-long"></i> Stable'}
          </span>
          <span class="metric-label-small">System cluster</span>
        </div>
      </div>
    </div>
    
    <div class="metric-card ${incidentsClass}">
      <div class="metric-header">
        <span>Active Incidents</span>
        <i class="fa-solid fa-triangle-exclamation metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${metrics.activeIncidents}</span>
        <div class="metric-footer">
          <span class="metric-label-small">${metrics.activeIncidents > 0 ? 'Cascading outages active' : 'No disruptions detected'}</span>
        </div>
      </div>
    </div>
    
    <div class="metric-card ${alertsClass}">
      <div class="metric-header">
        <span>Critical Alerts</span>
        <i class="fa-solid fa-bell metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${metrics.criticalAlerts}</span>
        <div class="metric-footer">
          <span class="metric-label-small">${metrics.criticalAlerts > 0 ? 'Correlated triggers' : 'Reporting normal state'}</span>
        </div>
      </div>
    </div>
    
    <div class="metric-card ${riskClass}">
      <div class="metric-header">
        <span>Revenue at Risk</span>
        <i class="fa-solid fa-indian-rupee-sign metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${metrics.revenueAtRisk}</span>
        <div class="metric-footer">
          <span class="metric-change ${metrics.revenueAtRiskNumeric > 0 ? 'down' : 'up'}">
            ${metrics.revenueAtRiskNumeric > 0 ? '<i class="fa-solid fa-circle-exclamation"></i> High Risk' : '<i class="fa-solid fa-circle-check"></i> Safe'}
          </span>
          <span class="metric-label-small">Estimated / hour</span>
        </div>
      </div>
    </div>
    
    <div class="metric-card ${metrics.customersAffected !== '0' ? 'critical' : 'healthy'}">
      <div class="metric-header">
        <span>Customers Affected</span>
        <i class="fa-solid fa-users metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${metrics.customersAffected}</span>
        <div class="metric-footer">
          <span class="metric-label-small">${metrics.customersAffected !== '0' ? 'Transaction drops' : 'Normal user traffic'}</span>
        </div>
      </div>
    </div>
    
    <div class="metric-card ${isSim && failure.stripeOutage ? 'critical' : 'healthy'}">
      <div class="metric-header">
        <span>Average API Latency</span>
        <i class="fa-solid fa-clock metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${metrics.averageApiLatency}</span>
        <div class="metric-footer">
          <span class="metric-label-small">SLA Target: < 300 ms</span>
        </div>
      </div>
    </div>
    
    <div class="metric-card info">
      <div class="metric-header">
        <span>Incident Resolution Rate</span>
        <i class="fa-solid fa-bolt-lightning metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${metrics.incidentResolutionRate}</span>
        <div class="metric-footer">
          <span class="metric-label-small">MTTR: 18 minutes</span>
        </div>
      </div>
    </div>
  `;
  
  // Update Health Gauge Text Overlay
  document.getElementById('health-percentage-display').innerText = `${metrics.businessHealthScore}%`;
  const badge = document.getElementById('business-health-badge');
  if (metrics.businessHealthScore >= 95) {
    badge.className = "badge healthy";
    badge.innerText = `${metrics.businessHealthScore}% Stable`;
  } else if (metrics.businessHealthScore >= 80) {
    badge.className = "badge warning";
    badge.innerText = `${metrics.businessHealthScore}% Degraded`;
  } else {
    badge.className = "badge critical";
    badge.innerText = `${metrics.businessHealthScore}% Critical`;
  }

  document.getElementById('dashboard-latency-indicator').innerText = `Avg: ${metrics.averageApiLatency}`;
  
  updateDashboardSystemGrid();
}

function updateDashboardSystemGrid() {
  const grid = document.getElementById('dashboard-system-grid');
  if (!grid) return;
  
  const sources = SentinelData.getDataSources();
  grid.innerHTML = sources.slice(0, 6).map(s => {
    let statusClass = 'healthy';
    if (s.status === 'Degraded') statusClass = 'warning';
    if (s.status.includes('Fallback')) statusClass = 'healthy';
    
    return `
      <div class="system-status-item">
        <div class="system-info-wrapper">
          <div class="system-icon"><i class="fa-solid fa-server"></i></div>
          <div>
            <span class="system-name">${s.name}</span>
            <div class="system-health-mini">Health: ${s.health}%</div>
          </div>
        </div>
        <span class="status-dot ${statusClass}"></span>
      </div>
    `;
  }).join('');
}

// Update Timeline
function updateTimeline() {
  const timeline = document.getElementById('timeline-list');
  if (!timeline) return;
  
  const incidents = SentinelData.getIncidents();
  timeline.innerHTML = incidents.slice(0, 4).map(inc => {
    let sevClass = 'warning';
    if (inc.severity === 'Critical') sevClass = 'critical';
    if (inc.status === 'Resolved') sevClass = 'healthy';
    
    return `
      <div class="timeline-item">
        <div class="timeline-marker ${sevClass}"></div>
        <div class="timeline-details">
          <div class="timeline-header-info">
            <span class="timeline-title">${inc.title}</span>
            <span class="timeline-time">${inc.timestamp}</span>
          </div>
          <span class="timeline-summary">${inc.rootCause} | Impact: ${inc.revenueLoss} lost</span>
        </div>
      </div>
    `;
  }).join('');
}

// Recent Alerts Table (Dashboard)
function updateDashboardAlerts() {
  const tbody = document.getElementById('dashboard-alerts-tbody');
  if (!tbody) return;
  
  const alerts = SentinelData.getAlerts();
  tbody.innerHTML = alerts.slice(0, 5).map(a => {
    let prioClass = 'info';
    if (a.priority === 'Critical') prioClass = 'critical';
    if (a.priority === 'Warning') prioClass = 'warning';
    
    return `
      <tr>
        <td><span class="tag-correlated">${a.id}</span></td>
        <td>${a.source}</td>
        <td><span class="badge ${prioClass}">${a.priority}</span></td>
      </tr>
    `;
  }).join('');
}

// AI Recommendations (Dashboard)
function updateDashboardAIRecommendations() {
  const container = document.getElementById('dashboard-ai-recommendations');
  if (!container) return;
  
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  if (isSim) {
    let recsHtml = '';
    
    if (failure.stripeOutage) {
      recsHtml += `
        <div class="ai-recommendation-item" style="border-left-color: var(--status-critical);">
          <div class="ai-rec-header">
            <span class="ai-rec-badge" style="background-color: var(--status-critical-bg); color: var(--status-critical);">Trigger Runbook</span>
            <span class="ai-rec-conf">94% confidence</span>
          </div>
          <span class="ai-rec-action">Switch Traffic to Backup Gateway</span>
          <span class="ai-rec-reason">Divert transaction requests to Adyen API fallback. Resolves Stripe HTTP 504 timeouts.</span>
        </div>
      `;
    }
    
    if (failure.checkoutOverload) {
      recsHtml += `
        <div class="ai-recommendation-item" style="border-left-color: var(--status-critical);">
          <div class="ai-rec-header">
            <span class="ai-rec-badge">Autoscaler Option</span>
            <span class="ai-rec-conf">89% confidence</span>
          </div>
          <span class="ai-rec-action">Autoscale Checkout replicas +4 nodes</span>
          <span class="ai-rec-reason">Increase thread pool limits to clear requests queue backlog.</span>
        </div>
      `;
    }
    
    if (failure.dbSyncBlocked) {
      recsHtml += `
        <div class="ai-recommendation-item" style="border-left-color: var(--status-warning);">
          <div class="ai-rec-header">
            <span class="ai-rec-badge">Sync Recovery</span>
            <span class="ai-rec-conf">82% confidence</span>
          </div>
          <span class="ai-rec-action">Restart Inventory DB Sync Scheduler</span>
          <span class="ai-rec-reason">Flush connections and clear synchronization scheduler cache backlog.</span>
        </div>
      `;
    }
    
    if (recsHtml === '') {
      recsHtml = `
        <div class="ai-recommendation-item" style="border-left-color: var(--status-healthy);">
          <div class="ai-rec-header">
            <span class="ai-rec-badge" style="background-color: var(--status-healthy-bg); color: var(--status-healthy);">System Safe</span>
            <span class="ai-rec-conf">100% healed</span>
          </div>
          <span class="ai-rec-action">Monitoring Residual queue flushing</span>
          <span class="ai-rec-reason">Outages successfully resolved. Maintaining monitoring metrics.</span>
        </div>
      `;
    }
    
    container.innerHTML = recsHtml;
    
    // Executive summary text based on active cascading failures
    let activeFailuresList = [];
    if (failure.stripeOutage) activeFailuresList.push("Stripe Latency Timeout");
    if (failure.checkoutOverload) activeFailuresList.push("Checkout Threadpool Exhaustion");
    if (failure.dbPoolExhausted) activeFailuresList.push("Production DB Connections exhaustion");
    if (failure.dbSyncBlocked) activeFailuresList.push("Inventory Sync Delay");
    if (failure.supportSurge) activeFailuresList.push("HubSpot CRM Ticket Overflow");
    
    if (activeFailuresList.length > 0) {
      document.getElementById('dashboard-executive-summary').innerHTML = `
        <span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> <strong>Cascading Outages Active:</strong> ${activeFailuresList.join(', ')}. Initial trigger is Stripe API timeouts. AI diagnostic tree isolated 5 inter-linked failures. Click "Explain Root Cause" to view details.</span>
      `;
      document.getElementById('dashboard-automation-status-badge').className = "badge critical";
      document.getElementById('dashboard-automation-status-badge').innerText = "Cascading Anomalies";
    } else {
      document.getElementById('dashboard-executive-summary').innerHTML = `
        <span><i class="fa-solid fa-circle-check" style="color: var(--status-healthy);"></i> <strong>Resolved:</strong> Automated mitigations completed. Stripe fallback switched to Adyen, containers scaled, and DB pools flushed. System health stabilized.</span>
      `;
      document.getElementById('dashboard-automation-status-badge').className = "badge healthy";
      document.getElementById('dashboard-automation-status-badge').innerText = "Outages Resolved";
    }
  } else {
    // Normal State
    container.innerHTML = `
      <div class="ai-recommendation-item">
        <div class="ai-rec-header">
          <span class="ai-rec-badge">Periodic Maintenance</span>
          <span class="ai-rec-conf">99% confidence</span>
        </div>
        <span class="ai-rec-action">Optimize Database index on Order log</span>
        <span class="ai-rec-reason">Query times for 30-day dashboard reporting can be reduced by 12% via cluster indexing.</span>
      </div>
    `;
    document.getElementById('dashboard-executive-summary').innerHTML = `
      All enterprise business endpoints are operating within normal latency SLAs. Active transaction processing is healthy across all nodes.
    `;
    document.getElementById('dashboard-automation-status-badge').className = "badge healthy";
    document.getElementById('dashboard-automation-status-badge').innerText = "Auto-mitigation Ready";
  }
}

// Incidents Page population
function updateIncidentsTable() {
  const tbody = document.getElementById('incidents-tbody');
  if (!tbody) return;
  
  const searchInput = document.getElementById('incident-search-input').value.toLowerCase();
  const severityFilter = document.getElementById('incident-filter-severity').value;
  const serviceFilter = document.getElementById('incident-filter-service').value;
  const sortOption = document.getElementById('incident-sort').value;
  
  let incidents = SentinelData.getIncidents();
  
  // Search filter
  if (searchInput) {
    incidents = incidents.filter(inc => 
      inc.id.toLowerCase().includes(searchInput) ||
      inc.title.toLowerCase().includes(searchInput) ||
      inc.rootCause.toLowerCase().includes(searchInput) ||
      inc.affectedServices.toLowerCase().includes(searchInput)
    );
  }
  
  // Severity filter
  if (severityFilter !== 'All') {
    incidents = incidents.filter(inc => inc.severity === severityFilter);
  }
  
  // Service filter
  if (serviceFilter !== 'All') {
    incidents = incidents.filter(inc => inc.affectedServices.toLowerCase().includes(serviceFilter.toLowerCase()));
  }
  
  // Sort
  if (sortOption === 'Newest') {
    incidents.sort((a, b) => b.id.localeCompare(a.id));
  } else if (sortOption === 'Severity') {
    const sevWeight = { 'Critical': 3, 'Warning': 2, 'Minor': 1 };
    incidents.sort((a, b) => (sevWeight[b.severity] || 0) - (sevWeight[a.severity] || 0));
  } else if (sortOption === 'Progress') {
    incidents.sort((a, b) => a.resolutionProgress - b.resolutionProgress);
  }
  
  tbody.innerHTML = incidents.map(inc => {
    let badgeClass = 'info';
    if (inc.severity === 'Critical') badgeClass = 'critical';
    if (inc.severity === 'Warning') badgeClass = 'warning';
    
    let statusBadge = 'info';
    if (inc.status === 'Resolved') statusBadge = 'healthy';
    if (inc.status === 'Active') statusBadge = 'critical';
    if (inc.status === 'Investigating') statusBadge = 'warning';
    
    return `
      <tr>
        <td><a class="incident-id-link" onclick="openIncidentModal('${inc.id}')">${inc.id}</a></td>
        <td><strong>${inc.title}</strong></td>
        <td><span class="badge ${badgeClass}">${inc.severity}</span></td>
        <td>${inc.affectedServices}</td>
        <td>${inc.revenueLoss}</td>
        <td>${inc.affectedCustomers}</td>
        <td><span class="badge ${statusBadge}">${inc.status}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${inc.resolutionProgress}%;"></div>
            </div>
            <span style="font-size: 0.75rem;">${inc.resolutionProgress}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterIncidents() {
  updateIncidentsTable();
}

// Incident Details Modal Operations
function openIncidentModal(incId) {
  const modal = document.getElementById('incident-detail-modal');
  const body = document.getElementById('modal-inc-body');
  const runBtn = document.getElementById('modal-inc-run-auto');
  
  const incidents = SentinelData.getIncidents();
  const inc = incidents.find(i => i.id === incId);
  if (!inc) return;
  
  document.getElementById('modal-inc-title').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Incident Details – ${inc.id}`;
  
  let sevBadge = 'info';
  if (inc.severity === 'Critical') sevBadge = 'critical';
  if (inc.severity === 'Warning') sevBadge = 'warning';
  
  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">Incident Title</span>
        <span class="detail-value"><strong>${inc.title}</strong></span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Severity Level</span>
        <span><span class="badge ${sevBadge}">${inc.severity}</span></span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Detected Time</span>
        <span class="detail-value">${inc.timestamp}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Assigned Operations Team</span>
        <span class="detail-value">${inc.assignedTeam}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Affected Core Services</span>
        <span class="detail-value">${inc.affectedServices}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Assigned Status</span>
        <span class="detail-value">${inc.status}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Customers Impacted</span>
        <span class="detail-value">${inc.affectedCustomers} users</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Direct Revenue Loss</span>
        <span class="detail-value">${inc.revenueLoss}</span>
      </div>
      <div class="detail-item detail-value-full">
        <span class="detail-label">Root Cause Analysis</span>
        <span class="detail-value">${inc.rootCause}</span>
      </div>
      <div class="detail-item detail-value-full">
        <span class="detail-label">AI Calculated Business Impact</span>
        <span class="detail-value">${inc.businessImpact}</span>
      </div>
      <div class="detail-item detail-value-full">
        <span class="detail-label">AI Recommended Action</span>
        <span class="detail-value" style="border-left: 3px solid var(--accent-color); background-color: rgba(59, 130, 246, 0.05);">${inc.recommendedAction}</span>
      </div>
      <div class="detail-item detail-value-full">
        <span class="detail-label">Resolution Workflows Progress</span>
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px;">
          <div class="progress-bar-container" style="flex-grow: 1; height: 10px;">
            <div class="progress-bar-fill" style="width: ${inc.resolutionProgress}%;"></div>
          </div>
          <span style="font-weight: 600;">${inc.resolutionProgress}%</span>
        </div>
      </div>
    </div>
  `;
  
  // Show button inside modal if it's the Stripe gateway incident and still unresolved
  const failure = SentinelData.getFailureStates();
  if (inc.id === 'INC-889' && failure.stripeOutage) {
    runBtn.style.display = 'block';
  } else {
    runBtn.style.display = 'none';
  }
  
  modal.classList.add('active');
}

function closeIncidentModal() {
  document.getElementById('incident-detail-modal').classList.remove('active');
}

function runGatewayMitigationFromModal() {
  closeIncidentModal();
  triggerAutomationAction('gateway', 'Switch Backup Payment Gateway', 'Switches API routing configuration from Stripe Primary to Adyen Backup Gateway to bypass network outages.');
}

function exportIncidentReport() {
  showToast("Report Exported", "Sentinel incident report compilation downloaded successfully.", "healthy");
}

// Alerts Page population
function updateAlertsTable() {
  const tbody = document.getElementById('alerts-tbody');
  if (!tbody) return;
  
  const searchInput = document.getElementById('alert-search-input').value.toLowerCase();
  const priorityFilter = document.getElementById('alert-filter-priority').value;
  const correlationFilter = document.getElementById('alert-filter-correlation').value;
  
  let alerts = SentinelData.getAlerts();
  
  if (searchInput) {
    alerts = alerts.filter(a => 
      a.id.toLowerCase().includes(searchInput) ||
      a.source.toLowerCase().includes(searchInput) ||
      a.message.toLowerCase().includes(searchInput)
    );
  }
  
  if (priorityFilter !== 'All') {
    alerts = alerts.filter(a => a.priority === priorityFilter);
  }
  
  if (correlationFilter !== 'All') {
    if (correlationFilter === 'Correlated') {
      alerts = alerts.filter(a => a.correlation.includes('Correlated'));
    } else {
      alerts = alerts.filter(a => !a.correlation.includes('Correlated'));
    }
  }
  
  tbody.innerHTML = alerts.map(a => {
    let prioBadge = 'info';
    if (a.priority === 'Critical') prioBadge = 'critical';
    if (a.priority === 'Warning') prioBadge = 'warning';
    
    let statBadge = a.status === 'Cleared' ? 'healthy' : 'critical';
    let isCorrelated = a.correlation.includes('Correlated');
    
    return `
      <tr class="${isCorrelated ? 'alert-row-correlated' : ''}">
        <td><span class="tag-correlated">${a.id}</span></td>
        <td>${a.timestamp}</td>
        <td><span class="badge ${prioBadge}">${a.priority}</span></td>
        <td><strong>${a.source}</strong></td>
        <td>${a.message}</td>
        <td><span class="badge ${statBadge}">${a.status}</span></td>
        <td>
          ${isCorrelated 
            ? `<span class="tag-correlated"><i class="fa-solid fa-microchip"></i> ${a.correlation}</span>` 
            : `<span style="color: var(--text-muted); font-size: 0.75rem;">Uncorrelated log</span>`
          }
        </td>
      </tr>
    `;
  }).join('');
}

function filterAlerts() {
  updateAlertsTable();
}

// Business Impact Details
function updateBusinessImpactPage() {
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  const container = document.getElementById('impact-metrics-grid');
  if (!container) return;
  
  let riskTitle = "Safe";
  let riskClass = "healthy";
  let failCount = 0;
  let slaUptime = "99.99%";
  
  if (isSim) {
    // Count active issues to determine risk levels
    let count = 0;
    if (failure.stripeOutage) count++;
    if (failure.checkoutOverload) count++;
    if (failure.dbPoolExhausted) count++;
    if (failure.dbSyncBlocked) count++;
    if (failure.supportSurge) count++;
    
    if (count >= 4) {
      riskTitle = "HIGH RISK";
      riskClass = "critical";
      failCount = 14500;
      slaUptime = "98.42% (Violation Alert)";
    } else if (count >= 1) {
      riskTitle = "MEDIUM RISK";
      riskClass = "warning";
      failCount = 2800;
      slaUptime = "99.78%";
    } else {
      riskTitle = "Safe (Mitigated)";
      riskClass = "healthy";
      failCount = 0;
      slaUptime = "99.96%";
    }
  }
  
  container.innerHTML = `
    <div class="metric-card ${riskClass}">
      <div class="metric-header">
        <span>Business Risk Level</span>
        <i class="fa-solid fa-triangle-exclamation metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${riskTitle}</span>
        <div class="metric-footer">
          <span class="metric-label-small">Real-time risk scoring</span>
        </div>
      </div>
    </div>
    <div class="metric-card ${isSim && (failure.stripeOutage || failure.checkoutOverload) ? 'critical' : 'healthy'}">
      <div class="metric-header">
        <span>Order Failure Rate</span>
        <i class="fa-solid fa-basket-shopping metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${isSim ? (failure.stripeOutage ? '28.0%' : '1.8%') : '0.04%'}</span>
        <div class="metric-footer">
          <span class="metric-label-small">Checkout completions</span>
        </div>
      </div>
    </div>
    <div class="metric-card info">
      <div class="metric-header">
        <span>Customer Satisfaction Trend</span>
        <i class="fa-solid fa-face-smile metric-icon"></i>
      </div>
      <div class="metric-body">
        <span class="metric-value">${isSim ? (failure.stripeOutage ? '2.8 / 5' : '4.4 / 5') : '4.8 / 5'}</span>
        <div class="metric-footer">
          <span class="metric-label-small">Calculated customer CSAT</span>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('sla-failures-count').innerText = failCount.toLocaleString();
  document.getElementById('sla-failures-count').className = `sla-value-text ${isSim && failCount > 0 ? 'critical' : 'healthy'}`;
  document.getElementById('sla-uptime-percentage').innerText = slaUptime;
  document.getElementById('sla-uptime-percentage').className = `sla-value-text ${isSim && failCount > 10000 ? 'critical' : 'healthy'}`;
  
  const slaBadge = document.getElementById('sla-status-badge');
  if (isSim && failCount > 10000) {
    slaBadge.className = "badge critical";
    slaBadge.innerText = "SLA Breached";
  } else {
    slaBadge.className = "badge healthy";
    slaBadge.innerText = "SLA Compliant";
  }
  
  // Regional Impact list
  const regionalContainer = document.getElementById('regional-impact-container');
  if (regionalContainer) {
    let indiaPct = 5, euPct = 2, usPct = 3;
    if (isSim) {
      if (failure.stripeOutage) {
        indiaPct = 85; euPct = 40; usPct = 65;
      } else if (failure.checkoutOverload) {
        indiaPct = 22; euPct = 12; usPct = 18;
      } else {
        indiaPct = 8; euPct = 4; usPct = 6;
      }
    }
    
    const fillClass = (pct) => pct > 50 ? 'high' : (pct > 20 ? 'medium' : 'low');
    
    regionalContainer.innerHTML = `
      <div class="regional-item">
        <div class="regional-label-row">
          <span>Asia-Pacific (Mumbai Hub)</span>
          <strong>${indiaPct}% failure rate</strong>
        </div>
        <div class="regional-progress">
          <div class="regional-fill ${fillClass(indiaPct)}" style="width: ${indiaPct}%;"></div>
        </div>
      </div>
      <div class="regional-item">
        <div class="regional-label-row">
          <span>North America (N. Virginia Hub)</span>
          <strong>${usPct}% failure rate</strong>
        </div>
        <div class="regional-progress">
          <div class="regional-fill ${fillClass(usPct)}" style="width: ${usPct}%;"></div>
        </div>
      </div>
      <div class="regional-item">
        <div class="regional-label-row">
          <span>Europe (Frankfurt Hub)</span>
          <strong>${euPct}% failure rate</strong>
        </div>
        <div class="regional-progress">
          <div class="regional-fill ${fillClass(euPct)}" style="width: ${euPct}%;"></div>
        </div>
      </div>
    `;
  }
}

// AI Insights View
function updateAIInsightsView() {
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  const title = document.getElementById('ai-insights-hero-title');
  const desc = document.getElementById('ai-insights-hero-desc');
  const conf = document.getElementById('ai-confidence-percentage');
  const heroCard = document.getElementById('ai-insights-hero');
  
  const causeEl = document.getElementById('ai-root-cause-val');
  const recEl = document.getElementById('ai-recovery-val');
  const busEl = document.getElementById('ai-business-summary-val');
  const techEl = document.getElementById('ai-technical-val');
  const riskEl = document.getElementById('ai-risk-level-val');
  const mitEl = document.getElementById('ai-mitigation-val');
  
  if (isSim) {
    let count = 0;
    if (failure.stripeOutage) count++;
    if (failure.checkoutOverload) count++;
    if (failure.dbSyncBlocked) count++;
    
    if (count > 0) {
      heroCard.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      title.innerText = "Critical Cascading Outages Predicted";
      title.className = "ai-hero-title text-danger";
      desc.innerText = "Payment Gateway Latency anomaly is propagating directly across 5 systems. Expected cumulative revenue loss is ₹48 Lakh.";
      conf.innerText = "94%";
      conf.style.color = "var(--status-critical)";
      
      causeEl.innerHTML = `<span class="text-danger">Initial trigger: Primary payment gateway slow response timeout (4500ms).</span>`;
      recEl.innerText = "18 minutes (dependent on executing automated gateway redirection)";
      busEl.innerText = "Checkout failures spiked to 28% impacting 14,000 customers. Estimated financial loss accumulation rate is ₹2.4 Lakh / minute.";
      techEl.innerText = "Payment Service API timeouts triggered checkout thread lock, which exhausted the production DB pool, blocking inventory sync operations.";
      riskEl.innerHTML = `<span class="badge critical"><i class="fa-solid fa-triangle-exclamation"></i> High (Active Business Interruption)</span>`;
      mitEl.innerHTML = `<strong>1. Switch traffic routes to fallback gateway (Stripe -> Adyen).</strong><br>2. Autoscale checkout pods replica count by +4.<br>3. Reboot inventory DB sync node.`;
    } else {
      // Healed but still in simulating state
      heroCard.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      title.innerText = "Remediation Script Success";
      title.className = "ai-hero-title text-success";
      desc.innerText = "All runbooks executed successfully. Falling back routes stable. System recovered.";
      conf.innerText = "98%";
      conf.style.color = "var(--status-healthy)";
      
      causeEl.innerHTML = `<span class="text-success">Resolved. Fallback routing switched to Adyen gateway. Telemetry cleared.</span>`;
      recEl.innerText = "0 minutes (Fully stable)";
      busEl.innerText = "Checkout transaction health stabilized at 98.8%. Capped direct financial loss at ₹5 Lakh.";
      techEl.innerText = "Active gateway traffic switched. Checkout containers scaled. Database connection allocation limits flushed.";
      riskEl.innerHTML = `<span class="badge healthy"><i class="fa-solid fa-circle-check"></i> Low (Restored)</span>`;
      mitEl.innerText = "Monitor Stripe main gateway API recovery rates. Schedule automated recovery rollbacks.";
    }
  } else {
    // Normal State
    heroCard.style.border = '1px solid rgba(59, 130, 246, 0.25)';
    title.innerText = "Continuous Operational Analysis";
    title.className = "ai-hero-title";
    desc.innerText = "The AI is analyzing live system telemetry. No active cascading business deviations detected in transaction flows.";
    conf.innerText = "98%";
    conf.style.color = "var(--status-healthy)";
    
    causeEl.innerText = "Normal background processes. No anomalies detected.";
    recEl.innerText = "0 minutes (System stable)";
    busEl.innerText = "Transaction health, inventory synchronization, checkout operations, and delivery queues are healthy across all regions.";
    techEl.innerText = "System latency is stable. Network connection limits and CPU loads are within 22% buffer threshold. No active service scaling needed.";
    riskEl.innerHTML = `<span class="badge healthy"><i class="fa-solid fa-circle-check"></i> Low (Stable)</span>`;
    mitEl.innerText = "Verify scheduled inventory job at 00:00 UTC. Monitor payment gateway API buffer logs.";
  }
}

function generateAIReport() {
  const reportBox = document.getElementById('ai-report-box');
  if (!reportBox) return;
  
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  reportBox.style.display = 'block';
  
  let content = '';
  if (isSim) {
    let activeList = [];
    if (failure.stripeOutage) activeList.push("Stripe Latency Timeout");
    if (failure.checkoutOverload) activeList.push("Checkout API Threadpool Exhaustion");
    if (failure.dbSyncBlocked) activeList.push("Inventory Sync Delay Backlog");
    
    if (activeList.length > 0) {
      content = `
        <h4><i class="fa-solid fa-robot"></i> Sentinel AI Cascading Diagnosis Report</h4>
        <blockquote>Generated at ${new Date().toLocaleTimeString()} (Active Outage)</blockquote>
        <p><strong>Cascading Root Cause:</strong> A carrier failure in Stripe's network edge caused API timeouts (HTTP 504). This initial block propagated down to checkout endpoints and database resources:</p>
        <ul>
          <li><strong>API Latency:</strong> stripe response time spiked from 180ms to 4500ms, keeping thread locks open.</li>
          <li><strong>DB connection exhaustion:</strong> DB pool exhausted due to checkout threads keeping connections open.</li>
          <li><strong>Inventory Block:</strong> Scheduled inventories timed out waiting for DB writes, skewing stock catalogs.</li>
          <li><strong>Action Plan:</strong> Trigger all mitigations on the Automation tab immediately.</li>
        </ul>
      `;
    } else {
      content = `
        <h4><i class="fa-solid fa-robot"></i> Sentinel AI Remediation Report</h4>
        <blockquote>Generated at ${new Date().toLocaleTimeString()} (Outage Mitigated)</blockquote>
        <p><strong>Remediation Status: Fully Solved.</strong> Runbooks executed successfully. Stripe fallback established and queues flushed.</p>
      `;
    }
  } else {
    content = `
      <h4><i class="fa-solid fa-robot"></i> Sentinel AI Baseline Operations Audit</h4>
      <blockquote>Generated at ${new Date().toLocaleTimeString()} (Stable)</blockquote>
      <p>All monitored microservices are within normal latency bands. System is stable.</p>
    `;
  }
  
  reportBox.innerHTML = content;
  showToast("Report Compiled", "Diagnostic report generated below.", "info");
}

// 13. Automation Page Configurations
const automatedActionsList = [
  { id: 'gateway', title: 'Switch Backup Payment Gateway', desc: 'Diverts API payload routes from Stripe Primary to Fallback Adyen Gateway. Execute to resolve payment timeouts.', icon: 'fa-shuffle', team: 'Payment Operations' },
  { id: 'scale', title: 'Scale Infrastructure', desc: 'Autoscale checkout API container replicas by +4 nodes. Execute to handle request thread backlogs.', icon: 'fa-arrow-up-right-dots', team: 'DevOps' },
  { id: 'restart', title: 'Restart Service', desc: 'Force recycle payment transaction queue pods. Clears thread bottlenecks.', icon: 'fa-rotate', team: 'SRE Infrastructure' },
  { id: 'notify-devops', title: 'Notify DevOps', desc: 'Dispatch high-priority alert payload directly to DevOps PagerDuty channel.', icon: 'fa-users', team: 'Communications' },
  { id: 'notify-support', title: 'Notify Customer Support', desc: 'Alert HubSpot CRM customer queues of transaction failures to prepare queue notices.', icon: 'fa-headset', team: 'Customer Relations' },
  { id: 'notify-execs', title: 'Notify Executives', desc: 'Compile summary report and dispatch to Slack board members channels.', icon: 'fa-briefcase', team: 'Executive Board' },
  { id: 'ticket', title: 'Create Incident Ticket', desc: 'Generate Jira operations ticket tracking incident details and SLA compliance indicators.', icon: 'fa-ticket', team: 'Project Management' },
  { id: 'pause-jobs', title: 'Pause Background Jobs', desc: 'Temporarily suspend non-critical analytics scraping jobs to allocate maximum DB pool resources.', icon: 'fa-pause', team: 'DBA Team' }
];

function updateAutomationPage() {
  const grid = document.getElementById('automation-grid');
  if (!grid) return;
  
  const failure = SentinelData.getFailureStates();
  
  grid.innerHTML = automatedActionsList.map(act => {
    let actionState = 'Idle';
    let btnText = 'Execute';
    let isComplete = false;
    
    if (act.id === 'gateway' && !failure.stripeOutage) {
      actionState = 'Completed';
      btnText = 'Re-run Runbook';
      isComplete = true;
    }
    if (act.id === 'scale' && !failure.checkoutOverload) {
      actionState = 'Completed';
      btnText = 'Re-run Runbook';
      isComplete = true;
    }
    if (act.id === 'restart' && !failure.dbSyncBlocked) {
      actionState = 'Completed';
      btnText = 'Re-run Runbook';
      isComplete = true;
    }
    if (act.id === 'notify-support' && !failure.supportSurge) {
      actionState = 'Completed';
      btnText = 'Re-send';
      isComplete = true;
    }
    
    return `
      <div class="automation-card card" id="auto-card-${act.id}">
        <div class="auto-info">
          <div class="auto-title">
            <div class="auto-icon-box"><i class="fa-solid ${act.icon}"></i></div>
            <span>${act.title}</span>
          </div>
          <span class="auto-desc">${act.desc}</span>
        </div>
        
        <div class="auto-progress-wrapper" id="progress-wrapper-${act.id}">
          <div class="auto-progress-label">
            <span id="progress-text-${act.id}">Running script...</span>
            <span id="progress-pct-${act.id}">0%</span>
          </div>
          <div class="progress-bar-container" style="width: 100%; height: 6px;">
            <div class="progress-bar-fill" id="progress-bar-${act.id}" style="width: 0%;"></div>
          </div>
        </div>
        
        <div class="auto-action-bar">
          <span class="auto-status-indicator">
            Status: <span class="badge ${isComplete ? 'healthy' : 'info'}" id="status-badge-${act.id}">${actionState}</span>
          </span>
          <button class="btn btn-primary btn-sm" onclick="triggerAutomationAction('${act.id}', '${act.title}', '${act.desc}')">
            ${btnText}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function triggerAutomationAction(id, title, desc) {
  const modal = document.getElementById('automation-confirm-modal');
  const body = document.getElementById('auto-confirm-body');
  
  currentExecutingAutoAction = id;
  
  body.innerHTML = `
    <p>Are you sure you want to trigger the following automation runbook?</p>
    <div style="background-color: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color); margin-top: 10px;">
      <strong>${title}</strong><br>
      <span style="font-size: 0.75rem; color: var(--text-secondary);">${desc}</span>
    </div>
    <p style="margin-top: 10px; color: var(--status-warning); font-size: 0.75rem;"><i class="fa-solid fa-triangle-exclamation"></i> This action executes script overrides on live production containers.</p>
  `;
  
  modal.classList.add('active');
}

function closeAutoConfirmModal() {
  document.getElementById('automation-confirm-modal').classList.remove('active');
}

function executeAutomationFromModal() {
  closeAutoConfirmModal();
  const id = currentExecutingAutoAction;
  if (!id) return;
  
  const pWrapper = document.getElementById(`progress-wrapper-${id}`);
  const statusBadge = document.getElementById(`status-badge-${id}`);
  
  pWrapper.style.display = 'block';
  statusBadge.className = "badge warning";
  statusBadge.innerText = "Running";
  
  let progress = 0;
  const pBar = document.getElementById(`progress-bar-${id}`);
  const pText = document.getElementById(`progress-text-${id}`);
  const pPct = document.getElementById(`progress-pct-${id}`);
  
  const interval = setInterval(() => {
    progress += 10;
    pBar.style.width = `${progress}%`;
    pPct.innerText = `${progress}%`;
    
    if (progress === 30) pText.innerText = "Connecting database pools...";
    if (progress === 60) pText.innerText = "Deploying API configurations...";
    if (progress === 80) pText.innerText = "Verifying target latency response...";
    
    if (progress >= 100) {
      clearInterval(interval);
      pWrapper.style.display = 'none';
      
      // Update dynamic states
      SentinelData.triggerAutomation(id);
      
      showToast("Automation Succeeded", `Remediation runbook completed: ${id}`, "healthy");
      refreshAllViews();
      
      // Update Root Cause modal if it is active
      if (document.getElementById('rootcause-modal').classList.contains('active')) {
        renderRootCauseTree();
      }
    }
  }, 180);
}

// Data Sources view
function updateDataSourcesView() {
  const container = document.getElementById('sources-grid');
  if (!container) return;
  
  const sources = SentinelData.getDataSources();
  
  container.innerHTML = sources.map(s => {
    let statBadge = 'healthy';
    if (s.status === 'Degraded') statBadge = 'critical';
    if (s.status.includes('Fallback')) statBadge = 'warning';
    
    let fillClass = 'var(--status-healthy)';
    if (s.health < 80) fillClass = 'var(--status-critical)';
    else if (s.health < 98) fillClass = 'var(--status-warning)';
    
    return `
      <div class="source-card card">
        <div class="source-header-item">
          <div class="source-title-block">
            <div class="system-icon"><i class="fa-solid fa-network-wired"></i></div>
            <div>
              <strong>${s.name}</strong>
              <div class="source-category">${s.category}</div>
            </div>
          </div>
          <span class="badge ${statBadge}">${s.status}</span>
        </div>
        
        <div class="source-body-details">
          <div class="source-detail-row">
            <span>Last Sync</span>
            <strong>${s.lastSync}</strong>
          </div>
          <div class="source-detail-row">
            <span>Telemetry Feed Events</span>
            <strong>${s.events} / min</strong>
          </div>
          <div>
            <div class="source-detail-row">
              <span>Connector Health</span>
              <strong>${s.health}%</strong>
            </div>
            <div class="source-health-bar">
              <div class="source-health-fill" style="width: ${s.health}%; background-color: ${fillClass};"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openAddSourceModal() {
  document.getElementById('add-source-modal').classList.add('active');
}

function closeAddSourceModal() {
  document.getElementById('add-source-modal').classList.remove('active');
}

function submitNewSource() {
  const nameInput = document.getElementById('new-source-name').value;
  if (!nameInput) {
    alert("Please specify a valid source name.");
    return;
  }
  showToast("Connector Created", `Connecting telemetry feed from ${nameInput}...`, "info");
  
  setTimeout(() => {
    showToast("Connector Synced", `${nameInput} data connector established successfully.`, "healthy");
    closeAddSourceModal();
  }, 1000);
}

// ROOT CAUSE CASCADE DIAGNOSIS OVERLAY
function openRootCauseModal() {
  document.getElementById('rootcause-modal').classList.add('active');
  renderRootCauseTree();
}

function closeRootCauseModal() {
  document.getElementById('rootcause-modal').classList.remove('active');
}

function renderRootCauseTree() {
  const container = document.getElementById('rootcause-tree-container');
  if (!container) return;
  
  const failure = SentinelData.getFailureStates();
  
  // 5 Cascading steps
  const steps = [
    { 
      key: 'stripe', 
      num: '1', 
      title: 'Stripe Gateway Network Timeout (Trigger Event)', 
      desc: 'API response delayed > 4s, locking transaction execution routes.', 
      resolved: !failure.stripeOutage,
      runbookId: 'gateway',
      runbookTitle: 'Switch Backup Payment Gateway'
    },
    { 
      key: 'checkout', 
      num: '2', 
      title: 'Checkout API Thread Pool Congestion', 
      desc: 'API containers threads maxed out waiting for Stripe responses.', 
      resolved: !failure.checkoutOverload,
      runbookId: 'scale',
      runbookTitle: 'Autoscale Checkout Service'
    },
    { 
      key: 'dbpool', 
      num: '3', 
      title: 'Database Connection Pool Exhaustion', 
      desc: 'Main cluster connection limits locked. Cleared once gateway routing normalizes.', 
      resolved: !failure.dbPoolExhausted,
      runbookId: 'gateway', // resolved automatically when gateway is switched
      runbookTitle: 'Auto-heals via Payment Switch'
    },
    { 
      key: 'sync', 
      num: '4', 
      title: 'Inventory Sync delay backlog', 
      desc: 'DB connection locks delayed database synchronizations.', 
      resolved: !failure.dbSyncBlocked,
      runbookId: 'restart',
      runbookTitle: 'Restart Sync Node'
    },
    { 
      key: 'support', 
      num: '5', 
      title: 'Customer Complaint Tickets Overload', 
      desc: 'Webhook triggers backup HubSpot CRM support queues.', 
      resolved: !failure.supportSurge,
      runbookId: 'notify-support',
      runbookTitle: 'Notify Support (Broadcast)'
    }
  ];
  
  let html = '';
  steps.forEach((step, idx) => {
    const nodeClass = step.resolved ? 'active-resolved' : 'active-unresolved';
    const actionBtn = step.resolved 
      ? `<span class="badge healthy"><i class="fa-solid fa-circle-check"></i> Healed</span>`
      : `<button class="btn btn-sm btn-primary" onclick="triggerDirectMitigation('${step.runbookId}')">Run runbook</button>`;
      
    html += `
      <div class="rootcause-step-node ${nodeClass}">
        <div class="rc-node-left">
          <div class="rc-node-num">${step.resolved ? '<i class="fa-solid fa-check"></i>' : step.num}</div>
          <div class="rc-node-details">
            <span class="rc-node-title">${step.title}</span>
            <span class="rc-node-desc">${step.desc}</span>
          </div>
        </div>
        <div class="rc-node-action">${actionBtn}</div>
      </div>
    `;
    
    // Add connector line if not last item
    if (idx < steps.length - 1) {
      const connClass = step.resolved && steps[idx+1].resolved ? 'resolved' : 'active';
      html += `<div class="rc-connector-line ${connClass}"></div>`;
    }
  });
  
  container.innerHTML = html;
}

function triggerDirectMitigation(runbookId) {
  closeRootCauseModal();
  // Navigate to Automation page and highlight/trigger target runbook
  document.querySelector('[data-target="automation"]').click();
  setTimeout(() => {
    const card = document.getElementById(`auto-card-${runbookId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth' });
      // Trigger confirmation
      const runbookData = automatedActionsList.find(a => a.id === runbookId);
      if (runbookData) {
        triggerAutomationAction(runbookData.id, runbookData.title, runbookData.desc);
      }
    }
  }, 150);
}

function executeAllMitigationsAutonomously() {
  closeRootCauseModal();
  showToast("Autonomous Execution Initiated", "Running sequence of all 4 recommended runbooks...", "info");
  
  let delay = 0;
  const runbooks = ['gateway', 'scale', 'restart', 'notify-support'];
  
  runbooks.forEach(id => {
    setTimeout(() => {
      SentinelData.triggerAutomation(id);
      showToast("Runbook Complete", `Remediation executed successfully: ${id}`, "healthy");
      refreshAllViews();
      
      // If we are finished with sequence, notify user
      if (id === 'notify-support') {
        setTimeout(() => {
          showToast("Cascading Mitigations Complete", "All systems reporting healthy status.", "healthy");
        }, 500);
      }
    }, delay);
    delay += 1200; // run sequentially with 1.2s delay
  });
}

// Knowledge Graph SVG Rendering
function renderKnowledgeGraph() {
  const svg = document.getElementById('dependency-graph-svg');
  if (!svg) return;
  
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  svg.innerHTML = '';
  
  const nodes = [
    { id: 'chk', label: 'Checkout Service', x: 260, y: 150, health: 100, role: 'Checkout endpoint API' },
    { id: 'pay', label: 'Payment Service', x: 120, y: 240, health: 100, role: 'Transaction dispatch API' },
    { id: 'inv', label: 'Inventory DB', x: 420, y: 110, health: 100, role: 'Inventory Sync Sync' },
    { id: 'db', label: 'Production DB', x: 550, y: 220, health: 100, role: 'Order entries SQL DB' },
    { id: 'crm', label: 'CRM / Support', x: 280, y: 350, health: 100, role: 'CRM API tickets' },
    { id: 'log', label: 'Logistics API', x: 550, y: 340, health: 100, role: 'Shipment booking API' },
    { id: 'cloud', label: 'AWS Cloud servers', x: 420, y: 250, health: 100, role: 'Infrastructure hosting' }
  ];
  
  const links = [
    { source: 'chk', target: 'pay', isError: false },
    { source: 'chk', target: 'inv', isError: false },
    { source: 'pay', target: 'db', isError: false },
    { source: 'inv', target: 'db', isError: false },
    { source: 'chk', target: 'log', isError: false },
    { source: 'crm', target: 'chk', isError: false },
    { source: 'cloud', target: 'db', isError: false },
    { source: 'cloud', target: 'chk', isError: false }
  ];
  
  // Set health indices dynamically
  if (isSim) {
    if (failure.stripeOutage) nodes.find(n => n.id === 'pay').health = 42;
    if (failure.checkoutOverload) nodes.find(n => n.id === 'chk').health = 72;
    if (failure.dbPoolExhausted) nodes.find(n => n.id === 'db').health = 65;
    if (failure.dbSyncBlocked) nodes.find(n => n.id === 'inv').health = 76;
    if (failure.supportSurge) nodes.find(n => n.id === 'crm').health = 80;
    
    // Set link outages
    if (failure.stripeOutage) links.find(l => l.source === 'chk' && l.target === 'pay').isError = true;
    if (failure.dbPoolExhausted) links.find(l => l.source === 'pay' && l.target === 'db').isError = true;
  }
  
  // Render Links
  links.forEach(l => {
    const sNode = nodes.find(n => n.id === l.source);
    const tNode = nodes.find(n => n.id === l.target);
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', sNode.x);
    line.setAttribute('y1', sNode.y);
    line.setAttribute('x2', tNode.x);
    line.setAttribute('y2', tNode.y);
    line.setAttribute('class', l.isError ? 'graph-link error' : 'graph-link active');
    svg.appendChild(line);
  });
  
  // Render Nodes
  nodes.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let nodeStatusClass = 'active';
    if (n.health < 50) nodeStatusClass = 'critical';
    else if (n.health < 90) nodeStatusClass = 'degraded';
    
    g.setAttribute('class', `graph-node ${nodeStatusClass}`);
    g.setAttribute('onclick', `showNodeDetails('${n.label}', '${n.role}', ${n.health})`);
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', n.x);
    circle.setAttribute('cy', n.y);
    circle.setAttribute('r', 22);
    g.appendChild(circle);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', n.x);
    text.setAttribute('y', n.y + 36);
    text.textContent = n.label;
    g.appendChild(text);
    
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    badge.setAttribute('x', n.x);
    badge.setAttribute('y', n.y + 4);
    badge.setAttribute('fill', '#fff');
    badge.setAttribute('font-size', '9px');
    badge.setAttribute('font-weight', '700');
    badge.setAttribute('text-anchor', 'middle');
    badge.textContent = `${n.health}%`;
    g.appendChild(badge);
    
    svg.appendChild(g);
  });
}

function showNodeDetails(name, role, health) {
  let status = "Healthy";
  if (health < 50) status = "CRITICAL OUTAGE";
  else if (health < 90) status = "DEGRADED SLOWDOWN";
  
  showToast(`Dependency Node: ${name}`, `Role: ${role} | Health: ${health}% | Status: ${status}`, health < 50 ? "critical" : (health < 90 ? "warning" : "healthy"));
}

// Explain Feature System
const explainers = {
  dashboard: {
    title: 'Operations Dashboard Guide',
    content: `
      <p><strong>Sentinel AI Dashboard</strong> serves as the central operations console. It correlates metrics from different layers into a unified business state representation.</p>
      <ul>
        <li><strong>Summary metrics cards:</strong> Display aggregate key business indicators such as Active incidents, critical alerts, and revenue loss figures.</li>
        <li><strong>Real-Time timeline:</strong> Chronological events compilation mapping underlying issues with operational disruption.</li>
        <li><strong>System Status Grid:</strong> Individual connector status. Bypassing manual dashboards.</li>
        <li><strong>API Performance Chart:</strong> Tracks microservice latency. Shows critical spikes when gateways drop.</li>
      </ul>
    `
  },
  incidents: {
    title: 'How Incidents Management Works',
    content: `
      <p><strong>Incidents</strong> compile related raw alarms into single actionable issues using Sentinel AI correlation models.</p>
      <ul>
        <li>Each incident displays its Title, Root cause, affected Services, affected customer counts, and exact financial risk calculations.</li>
        <li><strong>Sort & Filters:</strong> Search and narrow down incidents using filters for priority severity and target services.</li>
        <li><strong>Detail Modal:</strong> Click any incident ID to open full detailed analysis dashboards containing AI recommended actions and recovery ETAs.</li>
      </ul>
    `
  },
  alerts: {
    title: 'System Alerts Guide',
    content: `
      <p><strong>Alerts Page</strong> displays the raw log notifications stream gathered from Datadog, CloudWatch, and payment APIs.</p>
      <ul>
        <li>Allows developers to trace historical API failures.</li>
        <li><strong>Correlation Badge:</strong> Displays which business incident compiled this alert. Prevents alarm fatigue.</li>
      </ul>
    `
  },
  impact: {
    title: 'Business Impact Analytics Guide',
    content: `
      <p>This panel shows how technical issues translate to financial and SLA risks.</p>
      <ul>
        <li><strong>Revenue loss trend:</strong> Visualizes the real-time financial savings or losses resulting from system disruptions.</li>
        <li><strong>SLA Guard:</strong> Calculates contract compliance percentages and transaction failure counts.</li>
        <li><strong>Regional impact:</strong> Progress bars indicating failure propagation inside localized regional hubs.</li>
      </ul>
    `
  },
  insights: {
    title: 'AI Insights Model Guide',
    content: `
      <p>Simulates AI deep diagnostics models, displaying diagnostic summaries, recovery calculations, and mitigation recommendations.</p>
      <ul>
        <li><strong>Generate AI Report:</strong> Compiles detailed technical logs, business loss summaries, and prognoses into an audit report.</li>
      </ul>
    `
  },
  automation: {
    title: 'Automated Remediation Guide',
    content: `
      <p>Lists available self-healing runbooks. Can be run manually by operations teams or automatically by the Sentinel AI trigger engine.</p>
      <ul>
        <li><strong>Execution Progress:</strong> Displays animated progress indicators when running microservice overrides.</li>
        <li><strong>Gateway Switch:</strong> Simulates fallback switching, showing recovery metrics automatically updating.</li>
      </ul>
    `
  },
  sources: {
    title: 'Telemetry Connectors Guide',
    content: `
      <p>Manage data pipelines delivering metrics, logs, and traces. Connected status and events processed per minute are updated dynamically.</p>
    `
  },
  graph: {
    title: 'System Dependency Graph Guide',
    content: `
      <p>Interactive topology map illustrating system dependencies.</p>
      <ul>
        <li>Nodes pulsate green when healthy, red when outages propagate.</li>
        <li>Displays cascading paths, illustrating how payment latency propagates back into the checkout, inventory, and logistics services.</li>
      </ul>
    `
  },
  settings: {
    title: 'Configurations Guide',
    content: `
      <p>Allows configuration of sensitivity limits, LLM configurations, Slack/PagerDuty webhooks, and light/dark theme choices.</p>
    `
  }
};

function explainCurrentFeature(pageId) {
  const modal = document.getElementById('explainer-modal');
  const title = document.getElementById('explainer-title');
  const body = document.getElementById('explainer-body');
  
  const data = explainers[pageId];
  if (data) {
    title.innerHTML = `<i class="fa-solid fa-circle-question"></i> How It Works – ${data.title}`;
    body.innerHTML = data.content;
    modal.classList.add('active');
  }
}

function closeExplainerModal() {
  document.getElementById('explainer-modal').classList.remove('active');
}

// Chart.js Configurations & Rendering
function renderDashboardCharts() {
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  const fontColor = document.body.classList.contains('light-theme') ? '#475569' : '#94a3b8';
  const gridColor = document.body.classList.contains('light-theme') ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
  
  // Calculate active issues
  let activeCount = 0;
  if (isSim) {
    if (failure.stripeOutage) activeCount++;
    if (failure.checkoutOverload) activeCount++;
    if (failure.dbSyncBlocked) activeCount++;
    if (failure.supportSurge) activeCount++;
  }
  
  // Chart 1: Business Health Gauge (Doughnut)
  const healthCtx = document.getElementById('chart-health-gauge');
  if (healthCtx) {
    if (healthGaugeChart) healthGaugeChart.destroy();
    
    let score = 98;
    let color = '#10b981';
    if (isSim) {
      score = 98 - (activeCount * 12);
      if (score < 45) score = 45;
      
      if (score >= 95) color = '#10b981';
      else if (score >= 80) color = '#f97316';
      else color = '#ef4444';
    }
    
    healthGaugeChart = new Chart(healthCtx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [color, 'rgba(255,255,255,0.08)'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }
  
  // Chart 2: API Latency Trend (Line)
  const latencyCtx = document.getElementById('chart-api-latency');
  if (latencyCtx) {
    if (apiLatencyChart) apiLatencyChart.destroy();
    
    const labels = SentinelData.getChartTimestamps(10, 2);
    let data = [180, 192, 175, 188, 195, 182, 170, 190, 185, 180];
    
    if (isSim) {
      if (failure.stripeOutage) {
        data = [180, 192, 175, 188, 380, 1200, 2900, 4100, 4400, 4500];
      } else if (failure.checkoutOverload) {
        data = [180, 4400, 4500, 2100, 1600, 1650, 1580, 1610, 1590, 1600];
      } else {
        data = [4500, 2100, 800, 320, 210, 205, 190, 180, 195, 200];
      }
    }
    
    apiLatencyChart = new Chart(latencyCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'API Response Time (ms)',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: fontColor } },
          y: { grid: { color: gridColor }, ticks: { color: fontColor } }
        }
      }
    });
  }
  
  // Chart 3: Revenue Loss Chart (Bar - Impact view)
  const revCtx = document.getElementById('chart-revenue-loss');
  if (revCtx) {
    if (revenueLossChart) revenueLossChart.destroy();
    
    const labels = SentinelData.getChartTimestamps(8, 5);
    let data = [0, 0, 0, 0, 0, 0, 0, 0];
    
    if (isSim) {
      let cap = 0;
      if (failure.stripeOutage) cap += 24;
      if (failure.checkoutOverload) cap += 12;
      if (failure.dbSyncBlocked) cap += 6;
      
      data = [0, 2, 8, 14, 20, 26, 32, cap || 4];
    }
    
    revenueLossChart = new Chart(revCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue Loss (Lakhs)',
          data: data,
          backgroundColor: '#ef4444',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: fontColor } },
          y: { grid: { color: gridColor }, ticks: { color: fontColor } }
        }
      }
    });
  }
  
  // Chart 4: Customer Complaints/CSAT Trend (Line)
  const custCtx = document.getElementById('chart-customer-complaints');
  if (custCtx) {
    if (customerComplaintsChart) customerComplaintsChart.destroy();
    
    const labels = SentinelData.getChartTimestamps(8, 5);
    let complaints = [2, 1, 3, 2, 4, 3, 2, 2];
    
    if (isSim) {
      if (failure.stripeOutage) {
        complaints = [2, 1, 14, 45, 92, 148, 192, 210];
      } else if (failure.checkoutOverload) {
        complaints = [210, 140, 80, 52, 45, 41, 48, 50];
      } else {
        complaints = [92, 40, 15, 8, 5, 2, 3, 2];
      }
    }
    
    customerComplaintsChart = new Chart(custCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Customer Support Complaint volume',
          data: complaints,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: fontColor } },
          y: { grid: { color: gridColor }, ticks: { color: fontColor } }
        }
      }
    });
  }
  
  updateBusinessImpactPage();
}

// Chatbot Assistant Engine
function toggleChatbot() {
  document.getElementById('chatbot-panel').classList.toggle('active');
  document.getElementById('chatbot-trigger').classList.toggle('active');
  
  if (document.getElementById('chatbot-panel').classList.contains('active')) {
    document.getElementById('chatbot-user-input').focus();
  }
}

function initChatbot() {
  const container = document.getElementById('chatbot-messages-wrapper');
  if (!container) return;
  
  chatHistory = [
    { sender: 'bot', text: `<strong>Welcome SRE Operations Manager!</strong><br>I am the Sentinel AI Assistant. I have indexed our cluster telemetries and dependencies graph. I can isolate root causes or dispatch runbooks.<br><br>Try: <em>"Explain today's incident summary."</em>` }
  ];
  
  renderChatbotMessages();
  updateChatbotSuggestions();
}

function renderChatbotMessages() {
  const container = document.getElementById('chatbot-messages-wrapper');
  if (!container) return;
  
  container.innerHTML = chatHistory.map((msg, idx) => {
    const isBot = msg.sender === 'bot';
    
    return `
      <div class="chat-bubble ${isBot ? 'bot' : 'user'}">
        <div class="chat-bubble-avatar">
          ${isBot ? '<i class="fa-solid fa-robot"></i>' : 'SA'}
        </div>
        <div class="chat-bubble-content">
          ${msg.text}
          ${isBot ? `<button class="chat-copy-btn" onclick="copyChatText(this)" title="Copy Response"><i class="fa-regular fa-copy"></i></button>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  container.scrollTop = container.scrollHeight;
}

function copyChatText(btn) {
  const text = btn.parentElement.innerText;
  navigator.clipboard.writeText(text);
  showToast("Copied", "Response text copied to clipboard.", "healthy");
}

function clearChat() {
  initChatbot();
  showToast("Chat Cleared", "Chat conversation history reset.", "info");
}

function updateChatbotSuggestions() {
  const container = document.getElementById('chatbot-suggested-buttons');
  if (!container) return;
  
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  let buttons = [];
  if (isSim) {
    if (failure.stripeOutage) {
      buttons = [
        "Why is checkout failing?",
        "Explain the cascading root cause",
        "How much revenue is at risk?",
        "Trigger payment gateway switch"
      ];
    } else {
      buttons = [
        "What is the current health?",
        "Explain the residual outages",
        "Scale checkout containers"
      ];
    }
  } else {
    buttons = [
      "What is the system health?",
      "Are there active incidents?",
      "Which service fails most frequently?"
    ];
  }
  
  container.innerHTML = buttons.map(b => `
    <button class="btn-suggested" onclick="askChatbotQuestion('${b}')">${b}</button>
  `).join('');
}

function askChatbotQuestion(text) {
  document.getElementById('chatbot-user-input').value = text;
  sendChatbotMessage();
}

function handleChatInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatbotMessage();
  }
}

function sendChatbotMessage() {
  const inputEl = document.getElementById('chatbot-user-input');
  const text = inputEl.value.trim();
  if (!text) return;
  
  chatHistory.push({ sender: 'user', text: text });
  renderChatbotMessages();
  
  inputEl.value = '';
  
  const messagesContainer = document.getElementById('chatbot-messages-wrapper');
  const typingBubble = document.createElement('div');
  typingBubble.className = "chat-bubble bot";
  typingBubble.id = "chatbot-typing-bubble";
  typingBubble.innerHTML = `
    <div class="chat-bubble-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="chat-bubble-content">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(typingBubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  setTimeout(() => {
    const tb = document.getElementById('chatbot-typing-bubble');
    if (tb) tb.remove();
    
    const botReply = generateChatbotReply(text);
    chatHistory.push({ sender: 'bot', text: botReply });
    renderChatbotMessages();
  }, 1000);
}

function generateChatbotReply(query) {
  const q = query.toLowerCase();
  const isSim = SentinelData.getSimulationState();
  const failure = SentinelData.getFailureStates();
  
  if (q.includes('help') || q.includes('hello') || q.includes('hi ')) {
    return `Hello! I am your Sentinel AI operations companion. I can answer questions about active incidents, revenue risks, alerts, dependencies, and automated runbooks. Try asking <strong>"What is the current business health?"</strong>`;
  }
  
  // Incident rootcause & cascading explanation queries
  if (q.includes('why') || q.includes('outage') || q.includes('failing') || q.includes('root cause') || q.includes('cascade')) {
    if (isSim) {
      let issues = [];
      if (failure.stripeOutage) issues.push("<strong>Stripe Gateway Outage</strong> (1. Primary Stripe API timeouts > 4s)");
      if (failure.checkoutOverload) issues.push("<strong>Checkout API Thread Exhaustion</strong> (2. Thread pool maxed out waiting on payment response)");
      if (failure.dbPoolExhausted) issues.push("<strong>Main SQL DB connection exhaustion</strong> (3. Database connections locks)");
      if (failure.dbSyncBlocked) issues.push("<strong>Inventory Sync Delayed</strong> (4. Sync scheduler timeout writes)");
      if (failure.supportSurge) issues.push("<strong>HubSpot ticket overflow</strong> (5. Customer complaint spikes)");
      
      if (issues.length > 0) {
        return `
          <h4>Summary</h4>
          We are experiencing a cascading dependency failure triggered by network latency at our primary payment gateway.
          <h4>Cascading Root Cause Flow</h4>
          <ul>
            ${issues.map(i => `<li>${i}</li>`).join('')}
          </ul>
          <h4>Mitigation Steps</h4>
          To resolve these, we must run automated mitigations step-by-step:
          <ul>
            ${failure.stripeOutage ? '<li>Run runbook <strong>"Switch Backup Payment Gateway"</strong> to divert payment traffic to Adyen backup.</li>' : '<li><span class="text-success"><i class="fa-solid fa-circle-check"></i> Healed:</span> Payment gateway switched to backup Adyen.</li>'}
            ${failure.checkoutOverload ? '<li>Run runbook <strong>"Scale Infrastructure"</strong> to autoscale Checkout containers +4 pods.</li>' : '<li><span class="text-success"><i class="fa-solid fa-circle-check"></i> Healed:</span> Checkout containers autoscaled.</li>'}
            ${failure.dbSyncBlocked ? '<li>Run runbook <strong>"Restart Service"</strong> to reboot the inventory DB sync node.</li>' : '<li><span class="text-success"><i class="fa-solid fa-circle-check"></i> Healed:</span> Inventory DB sync scheduler rebooted.</li>'}
          </ul>
          <h4>Business Impact</h4>
          Estimated revenue at risk: <strong>₹${SentinelData.getSystemMetrics().revenueAtRisk}</strong>.
        `;
      } else {
        return `<strong>Resolved.</strong> All cascading outages are fully resolved. Secondary backup gateway routes are stable at 210ms.`;
      }
    } else {
      return `All transaction routes and system endpoints are operating within compliant limits. There are no active outages.`;
    }
  }
  
  // System Health
  if (q.includes('health') || q.includes('system status') || q.includes('unhealthy')) {
    const metrics = SentinelData.getSystemMetrics();
    if (isSim) {
      return `
        <h4>System Health Status: Critical (${metrics.businessHealthScore}%)</h4>
        <ul>
          <li>Healthy systems connected: ${metrics.healthyServices} / 10</li>
          <li>Active incidents: ${metrics.activeIncidents}</li>
          <li>Average response delay: ${metrics.averageApiLatency}</li>
        </ul>
      `;
    } else {
      return `<strong>System Health Status: Excellent (98%)</strong>. All 10 connected data sources are online and synchronized with 0 active alerts.`;
    }
  }
  
  // Revenue Risk
  if (q.includes('revenue') || q.includes('financial') || q.includes('risk') || q.includes('money')) {
    const metrics = SentinelData.getSystemMetrics();
    if (isSim && metrics.revenueAtRiskNumeric > 0) {
      return `
        <h4>Financial Impact Analysis</h4>
        Estimated revenue at risk: <strong>${metrics.revenueAtRisk}</strong>.
        <br>Active customer checkout completions affected: ${metrics.customersAffected}.
      `;
    } else {
      return `<strong>Revenue Risk: ₹0.</strong> Payment paths are healthy and SLA transaction rates are nominal.`;
    }
  }
  
  // Region
  if (q.includes('region') || q.includes('country') || q.includes('location')) {
    if (isSim) {
      return `
        <h4>Active Regional Outage Percentages</h4>
        <ul>
          <li><strong>Mumbai Hub (APAC):</strong> 85% transaction failures</li>
          <li><strong>N. Virginia (NA):</strong> 65% transaction failures</li>
          <li><strong>Frankfurt (EU):</strong> 40% transaction failures</li>
        </ul>
      `;
    } else {
      return `All regional operations (APAC, Europe, US-East) are fully operational with 0% failure flags.`;
    }
  }

  // Automation / Action execution queries
  if (q.includes('action') || q.includes('automat') || q.includes('switch') || q.includes('restart') || q.includes('scale')) {
    if (isSim) {
      if (q.includes('switch') && failure.stripeOutage) {
        return `Yes, you can trigger the <strong>Switch Backup Payment Gateway</strong> runbook directly from the <a href="#automation" onclick="document.querySelector('[data-target=&quot;automation&quot;]').click()">Automation Page</a> or click here to trigger: <button class="btn btn-primary btn-sm" onclick="runGatewayMitigationFromModal()">Switch Gateway</button>`;
      }
      return `
        <h4>Mitigation Workflow Logs</h4>
        <ul>
          <li>Switch Payment Gateway: ${!failure.stripeOutage ? '<span class="text-success">Executed Successfully</span>' : '<span class="text-danger">Recommended (Idle)</span>'}</li>
          <li>Scale Infrastructure (+4 pods): ${!failure.checkoutOverload ? '<span class="text-success">Executed</span>' : 'Pending'}</li>
          <li>Restart Sync scheduler node: ${!failure.dbSyncBlocked ? '<span class="text-success">Executed</span>' : 'Pending'}</li>
        </ul>
      `;
    } else {
      return `All automation mitigations are in standby (Idle). No self-healing actions have been triggered today.`;
    }
  }
  
  // department / stats
  if (q.includes('frequent') || q.includes('fail') || q.includes('department') || q.includes('trend')) {
    return `
      <h4>Historical Reliability Trends</h4>
      <ul>
        <li><strong>Most frequent fail path:</strong> Primary Payment Gateway (2 incidents this month)</li>
        <li><strong>Average Resolution Time:</strong> 18 minutes</li>
        <li><strong>Top Affected Department:</strong> Payment Operations / DevOps Infrastructure</li>
        <li><strong>Risk Prediction:</strong> Low risk forecast for tomorrow.</li>
      </ul>
    `;
  }
  
  return `I analyzed your query: "${query}". Based on the current platform telemetry, all systems are operating securely. Let me know if you would like me to compile an SRE incident report or check the Knowledge Graph.`;
}

// Light/Dark theme configuration switch
function toggleLightTheme(enabled) {
  if (enabled) {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  renderDashboardCharts();
}
