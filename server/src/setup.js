import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock browser APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Test environment configuration
global.TEST_ENV = {
  API_BASE_URL: 'http://localhost:3000',
  TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
  MONITORING: {
    INTERVAL: 1000,
    THRESHOLD: {
      CPU: 80,
      MEMORY: 85,
      LATENCY: 100,
      ERROR_RATE: 0.01
    }
  },
  SERVICES: {
    DATABASE: 'http://localhost:5432',
    CACHE: 'http://localhost:6379',
    QUEUE: 'http://localhost:5672'
  },
  TEST_DATA: {
    USERS: {
      ADMIN: { id: 'admin-123', role: 'admin', permissions: ['read', 'write', 'delete'] },
      REGULAR: { id: 'user-456', role: 'user', permissions: ['read'] }
    },
    SERVICES: {
      HEALTHY: { status: 'healthy', metrics: { errorRate: 0.001, latency: 50 } },
      DEGRADED: { status: 'degraded', metrics: { errorRate: 0.05, latency: 150 } },
      FAILING: { status: 'failing', metrics: { errorRate: 0.15, latency: 300 } }
    },
    SCENARIOS: {
      NORMAL: { load: 'normal', users: 100, errorRate: 0.01 },
      PEAK: { load: 'high', users: 1000, errorRate: 0.05 },
      STRESS: { load: 'extreme', users: 5000, errorRate: 0.1 }
    }
  },
  DATA_GENERATORS: {
    generateUserId: () => `user-${Math.random().toString(36).substr(2, 9)}`,
    generateTimestamp: (offset = 0) => new Date(Date.now() + offset).toISOString(),
    generateMetrics: (baseErrorRate = 0.01, baseLatency = 50) => ({
      errorRate: baseErrorRate + (Math.random() * 0.01),
      latency: baseLatency + (Math.random() * 20),
      cpu: Math.floor(Math.random() * 40) + 40,
      memory: Math.floor(Math.random() * 30) + 50
    }),
    generateLoadProfile: (userCount = 100) => ({
      activeUsers: userCount,
      requestRate: Math.floor(userCount * 0.8),
      responseTime: Math.floor(50 + (userCount * 0.1)),
      throughput: Math.floor(userCount * 0.7)
    }),
    generateServiceStatus: (service, health = 'healthy') => ({
      service,
      status: health,
      lastCheck: new Date().toISOString(),
      metrics: global.TEST_ENV.DATA_GENERATORS.generateMetrics(),
      availability: health === 'healthy' ? 0.999 : 0.95
    })
  },
  DATA_TRANSFORMERS: {
    normalizeMetrics: (metrics) => ({
      errorRate: Number((metrics.errorRate * 100).toFixed(2)),
      latency: Math.round(metrics.latency),
      cpu: Math.min(100, Math.max(0, metrics.cpu)),
      memory: Math.min(100, Math.max(0, metrics.memory))
    }),
    aggregateServiceMetrics: (services) => ({
      averageLatency: services.reduce((acc, s) => acc + s.metrics.latency, 0) / services.length,
      totalErrors: services.reduce((acc, s) => acc + s.metrics.errorRate, 0),
      healthScore: services.filter(s => s.status === 'healthy').length / services.length
    }),
    formatLoadData: (loadProfile) => ({
      concurrent: loadProfile.activeUsers,
      rps: Math.round(loadProfile.requestRate),
      avgResponseTime: `${loadProfile.responseTime}ms`,
      tps: Math.round(loadProfile.throughput)
    }),
    enrichServiceStatus: (status) => ({
      ...status,
      healthScore: status.metrics.errorRate < 0.01 ? 'good' : 'poor',
      lastUpdated: new Date().toISOString(),
      calculateTrends: (historicalData, timeframe = '1h') => ({
        trend: historicalData.reduce((acc, curr) => acc + curr.value, 0) / historicalData.length,
        peak: Math.max(...historicalData.map(d => d.value)),
        valley: Math.min(...historicalData.map(d => d.value)),
        timeframe,
        samples: historicalData.length
      }),
      
      formatErrorReport: (errors) => ({
        count: errors.length,
        categories: errors.reduce((acc, err) => {
          acc[err.type] = (acc[err.type] || 0) + 1;
          return acc;
        }, {}),
        mostFrequent: errors.length ? 
          errors.reduce((a, b) => 
            errors.filter(v => v.type === a.type).length >= 
            errors.filter(v => v.type === b.type).length ? a : b
          ).type : null
      }),
  
      summarizePerformance: (metrics, threshold) => ({
        status: metrics.latency < threshold ? 'acceptable' : 'concerning',
        percentageOfThreshold: (metrics.latency / threshold * 100).toFixed(1) + '%',
        recommendation: metrics.latency >= threshold ? 'investigate' : 'monitor'
      }),
  
      buildHealthReport: (services) => ({
        overall: services.every(s => s.status === 'healthy') ? 'healthy' : 'degraded',
        details: services.map(s => ({
          name: s.service,
          status: s.status,
          metrics: global.TEST_ENV.DATA_TRANSFORMERS.normalizeMetrics(s.metrics)
        })),
        timestamp: new Date().toISOString()
      })
    })
  }
}

// Configure test timeouts
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 5000,
  teardownTimeout: 5000
})

// Custom matchers for health monitoring
expect.extend({
  toBeHealthy(received) {
    const pass = received.status === 'healthy' && 
                 received.metrics.errorRate < global.TEST_ENV.MONITORING.THRESHOLD.ERROR_RATE &&
                 received.metrics.latency < global.TEST_ENV.MONITORING.THRESHOLD.LATENCY
    return {
      pass,
      message: () => pass 
        ? 'Expected service to not be healthy'
        : 'Expected service to be healthy'
    }
  },
  toHaveImprovedMetrics(received, previous) {
    const pass = received.metrics.latency < previous.metrics.latency &&
                 received.metrics.errorRate <= previous.metrics.errorRate
    return {
      pass,
      message: () => pass
        ? 'Expected metrics to not show improvement'
        : 'Expected metrics to show improvement'
    }
  }
})