/**
 * Sentinel AI - Mock Data & State Management (Expanded Version)
 * Manages baseline data sets, authentication state, and multi-issue cascading failure states.
 */

// Helper to generate timestamps relative to current time
function getRelativeTime(minutesAgo) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
}

function getChartTimestamps(count, intervalMinutes = 5) {
  const labels = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    labels.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
  return labels;
}

// 1. Initial Alerts list (50 Alerts)
const baseAlerts = [
  { id: 'ALT-101', timestamp: getRelativeTime(2), priority: 'Critical', source: 'Payment Gateway API', status: 'Active', message: 'Payment gateway API response time exceeded SLA threshold (4500ms)', correlation: 'Correlated (INC-889)' },
  { id: 'ALT-102', timestamp: getRelativeTime(3), priority: 'Critical', source: 'Checkout Service', status: 'Active', message: 'Checkout API container thread limit reached (500/500 connections)', correlation: 'Correlated (INC-890)' },
  { id: 'ALT-103', timestamp: getRelativeTime(4), priority: 'Warning', source: 'Database Cluster', status: 'Active', message: 'Production DB connection pool exhausted (100% allocations locked)', correlation: 'Correlated (INC-891)' },
  { id: 'ALT-104', timestamp: getRelativeTime(5), priority: 'Warning', source: 'Inventory DB', status: 'Active', message: 'Inventory synchronization queue delay exceeded 120s', correlation: 'Correlated (INC-892)' },
  { id: 'ALT-105', timestamp: getRelativeTime(6), priority: 'Warning', source: 'Customer Support CRM', status: 'Active', message: 'HubSpot webhook queue backlog > 450 items (support ticket spike)', correlation: 'Correlated (INC-893)' },
  { id: 'ALT-106', timestamp: getRelativeTime(15), priority: 'Info', source: 'Cloud Infrastructure', status: 'Cleared', message: 'Autoscaler warm node provisioned in regional cluster ap-south-1', correlation: 'Auto-resolved' },
  { id: 'ALT-107', timestamp: getRelativeTime(20), priority: 'Warning', source: 'Logistics API', status: 'Cleared', message: 'Carrier delivery API rate limiting triggered transient delay', correlation: 'None' },
  { id: 'ALT-108', timestamp: getRelativeTime(32), priority: 'Info', source: 'Security Gateway', status: 'Cleared', message: 'Security patch compliance check completed successfully on CRM subnets', correlation: 'None' }
];

// Seed up to 50 alerts
for (let i = 9; i <= 50; i++) {
  const sources = ['Database Cluster', 'Cloud Infrastructure', 'Website Analytics', 'Logistics API', 'Email Service', 'Notification Queue', 'CRM Service API'];
  const priorities = ['Warning', 'Info', 'Critical'];
  const source = sources[i % sources.length];
  const priority = priorities[i % priorities.length];
  const minutesAgo = 40 + i * 12;
  
  baseAlerts.push({
    id: `ALT-${100 + i}`,
    timestamp: getRelativeTime(minutesAgo),
    priority: priority,
    source: source,
    status: 'Cleared',
    message: `${source} reported baseline logs: ${i % 2 === 0 ? 'Buffer allocation recycling' : 'Connection reset by peer'}. No action needed.`,
    correlation: 'None'
  });
}

// 2. Base Incidents (20 Incidents)
const baseIncidents = [
  {
    id: 'INC-889',
    title: 'Stripe Gateway Latency Outage',
    severity: 'Critical',
    rootCause: 'Primary Payment Gateway network socket timeout due to carrier edge failure',
    businessImpact: 'Checkout API requests blocked. Payment failure rate spiked to 28%.',
    affectedServices: 'Payment Service, Checkout API',
    revenueLoss: '₹2,400,000',
    affectedCustomers: '8,500',
    status: 'Active',
    assignedTeam: 'Payment Operations',
    recommendedAction: 'Divert traffic to backup Adyen payment gateway runbook.',
    resolutionProgress: 20,
    timestamp: getRelativeTime(2)
  },
  {
    id: 'INC-890',
    title: 'Checkout API Thread Pool Exhaustion',
    severity: 'Critical',
    rootCause: 'Stripe timeout delays keeping API execution threads open indefinitely',
    businessImpact: 'Cascading lock on checkout completion endpoints. 14,000 customers impacted.',
    affectedServices: 'Checkout Service',
    revenueLoss: '₹1,200,000',
    affectedCustomers: '14,000',
    status: 'Active',
    assignedTeam: 'DevOps Platform Team',
    recommendedAction: 'Scale checkout container replicas (+4 nodes) to handle backup queue threads.',
    resolutionProgress: 10,
    timestamp: getRelativeTime(3)
  },
  {
    id: 'INC-891',
    title: 'Main DB Connection Pool Lock',
    severity: 'Warning',
    rootCause: 'Checkout threads keeping database connections allocated while waiting for Stripe responses',
    businessImpact: 'Secondary API requests and analytics dashboards reporting read slowdowns.',
    affectedServices: 'Production DB, BI Dashboards',
    revenueLoss: '₹400,000',
    affectedCustomers: '3,200',
    status: 'Active',
    assignedTeam: 'DBA Infrastructure',
    recommendedAction: 'Recycle connection pool limits or complete Stripe route failover.',
    resolutionProgress: 30,
    timestamp: getRelativeTime(4)
  },
  {
    id: 'INC-892',
    title: 'Inventory Sync Delay Overflow',
    severity: 'Warning',
    rootCause: 'Database connection locks delaying scheduled batch inventory writebacks',
    businessImpact: 'Out-of-stock items appearing orderable on catalog frontend.',
    affectedServices: 'Inventory DB, Catalog Service',
    revenueLoss: '₹600,000',
    affectedCustomers: '1,500',
    status: 'Active',
    assignedTeam: 'Catalog Core Devs',
    recommendedAction: 'Restart inventory sync scheduler service node.',
    resolutionProgress: 15,
    timestamp: getRelativeTime(5)
  },
  {
    id: 'INC-893',
    title: 'HubSpot Support Webhook Queue Congestion',
    severity: 'Minor',
    rootCause: 'Surge in checkout payment failure complaints overloading HubSpot webhook receivers',
    businessImpact: 'Customer support agents experiencing delayed ticketing queues.',
    affectedServices: 'Customer Support CRM, Notification Queue',
    revenueLoss: '₹200,000',
    affectedCustomers: '4,500',
    status: 'Active',
    assignedTeam: 'Customer Relations SRE',
    recommendedAction: 'Dispatch support broadcast notices and allocate backup ticketing buffers.',
    resolutionProgress: 40,
    timestamp: getRelativeTime(6)
  }
];

// Add 15 historical incidents to make a total of 20
for (let i = 6; i <= 20; i++) {
  const severities = ['Warning', 'Minor', 'Critical'];
  const severity = severities[i % severities.length];
  const minutesAgo = i * 280;
  
  baseIncidents.push({
    id: `INC-${880 - i}`,
    title: `Resolved Historical Incident: telemetry event on ${i % 2 === 0 ? 'Analytics DB cluster' : 'Logistics carrier sync'}`,
    severity: severity,
    rootCause: 'Transient network interruption resolved by auto-reconnect workflows.',
    businessImpact: 'Minimal. Direct service SLA remained compliant.',
    affectedServices: i % 2 === 0 ? 'Analytics, Database' : 'Logistics, Shipping',
    revenueLoss: '₹0',
    affectedCustomers: '0',
    status: 'Resolved',
    assignedTeam: 'Platform Reliability SRE',
    recommendedAction: 'Adjust telemetry reporting threshold configuration.',
    resolutionProgress: 100,
    timestamp: getRelativeTime(minutesAgo)
  });
}

// 3. Payment Failures details (15 failures)
const paymentFailuresData = [
  { id: 'PF-01', time: getRelativeTime(1), errorType: 'Timeout (HTTP 504)', value: '₹42,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-02', time: getRelativeTime(1), errorType: 'Timeout (HTTP 504)', value: '₹18,500', service: 'Primary Stripe Gateway' },
  { id: 'PF-03', time: getRelativeTime(2), errorType: 'Connection Reset', value: '₹125,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-04', time: getRelativeTime(2), errorType: 'Timeout (HTTP 504)', value: '₹95,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-05', time: getRelativeTime(3), errorType: 'Timeout (HTTP 504)', value: '₹310,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-06', time: getRelativeTime(3), errorType: 'Connection Reset', value: '₹64,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-07', time: getRelativeTime(4), errorType: 'Timeout (HTTP 504)', value: '₹22,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-08', time: getRelativeTime(4), errorType: 'Timeout (HTTP 504)', value: '₹140,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-09', time: getRelativeTime(5), errorType: 'Timeout (HTTP 504)', value: '₹18,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-10', time: getRelativeTime(5), errorType: 'Declined (Vendor Error)', value: '₹9,800', service: 'Primary Stripe Gateway' },
  { id: 'PF-11', time: getRelativeTime(6), errorType: 'Timeout (HTTP 504)', value: '₹75,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-12', time: getRelativeTime(8), errorType: 'Timeout (HTTP 504)', value: '₹115,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-13', time: getRelativeTime(10), errorType: 'Connection Reset', value: '₹55,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-14', time: getRelativeTime(12), errorType: 'Timeout (HTTP 504)', value: '₹210,000', service: 'Primary Stripe Gateway' },
  { id: 'PF-15', time: getRelativeTime(15), errorType: 'Timeout (HTTP 504)', value: '₹85,000', service: 'Primary Stripe Gateway' }
];

// 4. Data Sources default details
const dataSourcesData = [
  { name: 'Payment Gateway', category: 'Payment Gateway', status: 'Connected', lastSync: '1 minute ago', health: 98, events: '124.5k', id: 'payment' },
  { name: 'Inventory Sync', category: 'Inventory', status: 'Connected', lastSync: '3 minutes ago', health: 100, events: '84.2k', id: 'inventory' },
  { name: 'AWS Cloud Infra', category: 'Cloud Infrastructure', status: 'Connected', lastSync: '30 seconds ago', health: 99, events: '2.4M', id: 'infra' },
  { name: 'Production DB Cluster', category: 'Database', status: 'Connected', lastSync: '10 seconds ago', health: 100, events: '4.8M', id: 'database' },
  { name: 'HubSpot Integration', category: 'CRM', status: 'Connected', lastSync: '15 minutes ago', health: 100, events: '12.1k', id: 'crm' },
  { name: 'Zendesk Service API', category: 'Customer Support', status: 'Connected', lastSync: '5 minutes ago', health: 98, events: '3.4k', id: 'support' },
  { name: 'Google Analytics Hook', category: 'Website Analytics', status: 'Connected', lastSync: '1 minute ago', health: 100, events: '890k', id: 'analytics' },
  { name: 'Sentinel Metric Engine', category: 'Business KPIs', status: 'Connected', lastSync: 'Just now', health: 100, events: '1.2M', id: 'kpis' },
  { name: 'Datadog Alert Collector', category: 'Monitoring Tools', status: 'Connected', lastSync: 'Just now', health: 99, events: '15.6k', id: 'monitoring' },
  { name: 'Delhivery API Sync', category: 'Logistics', status: 'Connected', lastSync: '8 minutes ago', health: 95, events: '4.5k', id: 'logistics' }
];

// Cascading Outage Scenario Status variables
let isSimulating = false;

// 5 Active issue flags that represent the cascading outage
let stripeOutageActive = false;     // Solved by: Switch Backup Payment Gateway
let checkoutOverloadActive = false;  // Solved by: Scale Infrastructure
let dbPoolExhaustedActive = false;   // Solved by: Switch Backup Payment Gateway (cascading recovery)
let dbSyncBlockedActive = false;     // Solved by: Restart Service (Inventory Sync)
let supportSurgeActive = false;      // Solved by: Notify Customer Support

function setSimulationState(active) {
  isSimulating = active;
  stripeOutageActive = active;
  checkoutOverloadActive = active;
  dbPoolExhaustedActive = active;
  dbSyncBlockedActive = active;
  supportSurgeActive = active;
}

// Recalculates metrics based on active cascades
function getSystemMetrics() {
  if (!isSimulating) {
    return {
      totalSystemsConnected: 10,
      healthyServices: 10,
      activeIncidents: 0,
      criticalAlerts: 0,
      revenueAtRisk: '₹0',
      revenueAtRiskNumeric: 0,
      customersAffected: '0',
      averageApiLatency: '185 ms',
      incidentResolutionRate: '96.8%',
      businessHealthScore: 98
    };
  }

  // Count active failures
  let activeIssuesCount = 0;
  if (stripeOutageActive) activeIssuesCount++;
  if (checkoutOverloadActive) activeIssuesCount++;
  if (dbPoolExhaustedActive) activeIssuesCount++;
  if (dbSyncBlockedActive) activeIssuesCount++;
  if (supportSurgeActive) activeIssuesCount++;

  // Calculate dynamic outputs based on what's still broken
  let healthyServicesCount = 10 - activeIssuesCount;
  
  // Incidents
  let activeIncidentsCount = 0;
  if (stripeOutageActive) activeIncidentsCount++;
  if (checkoutOverloadActive) activeIncidentsCount++;
  if (dbPoolExhaustedActive) activeIncidentsCount++;
  if (dbSyncBlockedActive) activeIncidentsCount++;
  if (supportSurgeActive) activeIncidentsCount++;

  // Alerts
  let activeAlertsCount = activeIncidentsCount; // simplified mapping

  // Business Health Score
  let score = 98 - (activeIssuesCount * 11);
  if (score < 43) score = 43; // Floor

  // Revenue loss calculations
  let revenueLossVal = 0;
  if (stripeOutageActive) revenueLossVal += 2400000;
  if (checkoutOverloadActive) revenueLossVal += 1200000;
  if (dbPoolExhaustedActive) revenueLossVal += 400000;
  if (dbSyncBlockedActive) revenueLossVal += 600000;
  if (supportSurgeActive) revenueLossVal += 200000;

  let revenueAtRisk = '₹0';
  if (revenueLossVal > 0) {
    revenueAtRisk = `₹${(revenueLossVal / 100000).toFixed(0)} Lakh`;
  } else {
    revenueAtRisk = '₹0';
  }

  // Customers affected
  let custVal = 0;
  if (stripeOutageActive) custVal += 8500;
  if (checkoutOverloadActive) custVal += 14000;
  if (dbPoolExhaustedActive) custVal += 3200;
  if (dbSyncBlockedActive) custVal += 1500;
  if (supportSurgeActive) custVal += 4500;
  
  let customersAffectedStr = custVal > 0 ? custVal.toLocaleString() : '0';

  // API Latency
  let latencyVal = 185;
  if (stripeOutageActive) latencyVal = 4500;
  else if (checkoutOverloadActive) latencyVal = 1600;
  else if (dbPoolExhaustedActive) latencyVal = 820;
  else if (dbSyncBlockedActive) latencyVal = 380;
  else if (supportSurgeActive) latencyVal = 240;

  // Resolution Rate
  let resolutionRateStr = '96.8%';
  if (activeIssuesCount === 5) resolutionRateStr = '42.5%';
  else if (activeIssuesCount === 4) resolutionRateStr = '56.8%';
  else if (activeIssuesCount === 3) resolutionRateStr = '71.2%';
  else if (activeIssuesCount === 2) resolutionRateStr = '84.6%';
  else if (activeIssuesCount === 1) resolutionRateStr = '91.8%';
  else resolutionRateStr = '96.2%';

  // If everything resolved but we are technically still in "simulating" mode
  if (activeIssuesCount === 0) {
    return {
      totalSystemsConnected: 10,
      healthyServices: 10,
      activeIncidents: 0,
      criticalAlerts: 0,
      revenueAtRisk: '₹0 (Resolved)',
      revenueAtRiskNumeric: 0,
      customersAffected: '0',
      averageApiLatency: '200 ms',
      incidentResolutionRate: '95.4%',
      businessHealthScore: 96
    };
  }

  return {
    totalSystemsConnected: 10,
    healthyServices: healthyServicesCount,
    activeIncidents: activeIncidentsCount,
    criticalAlerts: activeAlertsCount,
    revenueAtRisk: revenueAtRisk,
    revenueAtRiskNumeric: revenueLossVal,
    customersAffected: customersAffectedStr,
    averageApiLatency: latencyVal + ' ms',
    incidentResolutionRate: resolutionRateStr,
    businessHealthScore: score
  };
}

// Bind to window for global access
window.SentinelData = {
  getRelativeTime,
  getChartTimestamps,
  getAlerts: () => {
    if (!isSimulating) {
      // Return alerts excluding outage ones
      return baseAlerts.filter(a => !['ALT-101', 'ALT-102', 'ALT-103', 'ALT-104', 'ALT-105'].includes(a.id));
    }
    
    // Check which ones are still active
    return baseAlerts.map(a => {
      if (a.id === 'ALT-101' && !stripeOutageActive) return { ...a, status: 'Cleared', message: a.message + ' - RESOLVED via Adyen Switch' };
      if (a.id === 'ALT-102' && !checkoutOverloadActive) return { ...a, status: 'Cleared', message: a.message + ' - RESOLVED via Autoscaling' };
      if (a.id === 'ALT-103' && !dbPoolExhaustedActive) return { ...a, status: 'Cleared', message: a.message + ' - RESOLVED via Gateway Pool Clear' };
      if (a.id === 'ALT-104' && !dbSyncBlockedActive) return { ...a, status: 'Cleared', message: a.message + ' - RESOLVED via Sync Node Reboot' };
      if (a.id === 'ALT-105' && !supportSurgeActive) return { ...a, status: 'Cleared', message: a.message + ' - RESOLVED via CSR broadcast' };
      return a;
    });
  },
  getIncidents: () => {
    if (!isSimulating) {
      // Exclude cascading incidents
      return baseIncidents.filter(inc => !['INC-889', 'INC-890', 'INC-891', 'INC-892', 'INC-893'].includes(inc.id));
    }
    
    return baseIncidents.map(inc => {
      if (inc.id === 'INC-889' && !stripeOutageActive) return { ...inc, status: 'Resolved', resolutionProgress: 100, revenueLoss: '₹120,000' };
      if (inc.id === 'INC-890' && !checkoutOverloadActive) return { ...inc, status: 'Resolved', resolutionProgress: 100, revenueLoss: '₹50,000' };
      if (inc.id === 'INC-891' && !dbPoolExhaustedActive) return { ...inc, status: 'Resolved', resolutionProgress: 100, revenueLoss: '₹0' };
      if (inc.id === 'INC-892' && !dbSyncBlockedActive) return { ...inc, status: 'Resolved', resolutionProgress: 100, revenueLoss: '₹20,000' };
      if (inc.id === 'INC-893' && !supportSurgeActive) return { ...inc, status: 'Resolved', resolutionProgress: 100, revenueLoss: '₹10,000' };
      return inc;
    });
  },
  getPaymentFailures: () => {
    return isSimulating && stripeOutageActive ? paymentFailuresData : [];
  },
  getDataSources: () => {
    return dataSourcesData.map(source => {
      if (!isSimulating) return source;
      
      if (source.id === 'payment' && stripeOutageActive) {
        return { ...source, status: 'Degraded', health: 42 };
      } else if (source.id === 'payment' && !stripeOutageActive) {
        return { ...source, status: 'Connected (Fallback)', health: 96 };
      }
      
      if (source.id === 'database' && dbPoolExhaustedActive) {
        return { ...source, status: 'Degraded', health: 65 };
      }
      
      if (source.id === 'inventory' && dbSyncBlockedActive) {
        return { ...source, status: 'Degraded', health: 76 };
      }
      
      if (source.id === 'support' && supportSurgeActive) {
        return { ...source, status: 'Degraded', health: 81 };
      }
      
      return source;
    });
  },
  
  // Simulation Active Checkers
  getSimulationState: () => isSimulating,
  setSimulationState,
  
  // Specific failures states check
  getFailureStates: () => ({
    stripeOutage: stripeOutageActive,
    checkoutOverload: checkoutOverloadActive,
    dbPoolExhausted: dbPoolExhaustedActive,
    dbSyncBlocked: dbSyncBlockedActive,
    supportSurge: supportSurgeActive
  }),
  
  // Trigger automation clears
  triggerAutomation: (type) => {
    if (type === 'gateway') {
      stripeOutageActive = false;
      dbPoolExhaustedActive = false; // Cascading recovery: fixing Stripe gateway clears DB locks!
    }
    if (type === 'scale') {
      checkoutOverloadActive = false;
    }
    if (type === 'restart') {
      dbSyncBlockedActive = false;
    }
    if (type === 'notify-support') {
      supportSurgeActive = false;
    }
  },
  
  getSystemMetrics
};
