export const mockFetchResponse = (response, status = 200) => {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response)
    })
  )
}

export const createDependencyMock = (status = 'connected', latency = 20) => ({
  status,
  latency,
  timestamp: new Date().toISOString()
})

export const generateVersionInfo = (current, required) => ({
  current,
  required,
  compatibility: {
    status: 'compatible',
    warnings: []
  }
})

export const mockErrorResponse = (errorType, details) => ({
  error: {
    type: errorType,
    details,
    timestamp: new Date().toISOString()
  }
})


export const mockDependencyHealth = (metrics = {}) => ({
  connections: metrics.connections || 100,
  queryLatency: metrics.latency || 15,
  errorRate: metrics.errorRate || 0.001,
  cpuUsage: metrics.cpuUsage || 60
})

export const mockDependencyTrends = (period = '1h', dataPoints = 12) => ({
  period,
  intervals: dataPoints,
  metrics: {
    latencyTrend: Array(dataPoints).fill(0).map(() => Math.floor(Math.random() * 30) + 10),
    errorTrend: Array(dataPoints).fill(0).map(() => (Math.random() * 0.002).toFixed(4))
  }
})

export const mockRecoveryPlan = (service, steps = []) => ({
  service,
  strategy: 'progressive',
  steps: steps.length ? steps : ['verify', 'restart', 'validate'],
  estimatedTime: steps.length * 30,
  priority: 'high'
})

export const mockServiceMetrics = (service, status = 'healthy') => ({
  name: service,
  status,
  metrics: mockDependencyHealth(),
  lastUpdated: new Date().toISOString()
})


export const mockNetworkError = (type = 'timeout') => {
  const errors = {
    timeout: { message: 'Request timed out', code: 'ETIMEDOUT' },
    dns: { message: 'DNS lookup failed', code: 'ENOTFOUND' },
    connection: { message: 'Connection refused', code: 'ECONNREFUSED' },
    ssl: { message: 'SSL Certificate error', code: 'CERT_INVALID' }
  }
  return new Error(errors[type].message)
}

export const mockServiceError = (service, type, details = {}) => ({
  service,
  error: {
    type,
    timestamp: new Date().toISOString(),
    details: {
      code: details.code || 'ERR_001',
      retryable: details.retryable !== false,
      ...details
    }
  }
})

export const mockFailureScenario = (primary, cascading = []) => ({
  primary: mockServiceError(primary, 'failure'),
  cascade: {
    affected: cascading,
    unaffected: ['storage'],
    propagationPath: [primary, ...cascading]
  }
})


export const mockRecoveryStatus = (stage, progress = 100) => ({
  stage,
  progress,
  startTime: new Date(Date.now() - 5000).toISOString(),
  currentTime: new Date().toISOString(),
  remainingTime: progress === 100 ? 0 : 30
})

export const mockRecoveryAttempt = (attempt = 1, success = true) => ({
  attempt,
  timestamp: new Date().toISOString(),
  success,
  duration: attempt * 1000,
  metrics: {
    resourceUsage: success ? 85 : 95,
    responseTime: success ? 200 : 500
  }
})

export const mockFailoverResult = (status = 'completed') => ({
  status,
  primaryNode: { status: 'inactive', lastHeartbeat: new Date().toISOString() },
  secondaryNode: { status: 'active', assumedRole: new Date().toISOString() },
  dataSync: { status: 'completed', lastCheckpoint: new Date().toISOString() }
})